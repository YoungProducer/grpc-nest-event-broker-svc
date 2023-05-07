import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType } from 'redis';
import {
  zip,
  from,
  of,
  Observable,
  BehaviorSubject,
  filter,
  map,
  mergeMap,
  tap,
} from 'rxjs';
import { randomUUID } from 'node:crypto';

import {
  EnvVars,
  EventBrokerCfg,
} from 'src/config/interfaces/env-vars.interface';
import {
  AddConsumerRequest,
  AddConsumerResponse,
} from 'src/proto/event-broker.pb';
import {
  ConsumerResponseDto,
  GetAllConsumersResponseDto,
} from './dto/get-all-consumers.response.dto';
import { DI_REDIS } from 'src/infrastucture/redis/constants';
import { RedisClientModuleGetter } from 'src/infrastucture/redis/interfaces';
import { ConsumeEventRequestDto } from './dto/consume-event.request.dto';
import { ConsumeEventResponseDto } from './dto/consume-event.response.dto';
import { EventBrokerEvent } from 'src/types/event';
import { StreamsMessagesReply } from 'src/types/redis-types';
import { ServerUnaryCall } from '@grpc/grpc-js';
import { CreateConsumerInGroupPayload } from './interfaces/create-consumer-in-group';
import { ProducerService } from '../producer/producer.service';
import { ConsumerIndex } from './interfaces/consumer-index';
import { RpcException } from '@nestjs/microservices';
import { consumerServiceErrorMsgs } from './constants/error-messages';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private streamKey: string;
  private eventBrokerCfg: EventBrokerCfg;
  private redisClient: RedisClientType;

  constructor(
    private readonly configService: ConfigService<EnvVars>,

    private readonly producerService: ProducerService,

    @Inject(DI_REDIS)
    private readonly redisClientGetter: RedisClientModuleGetter,
  ) {}

  async onModuleInit(): Promise<void> {
    this.redisClient = await this.redisClientGetter();
    this.streamKey = this.configService.get<string>('events_stream_key');
    this.eventBrokerCfg =
      this.configService.get<EventBrokerCfg>('event_broker_cfg');
  }

  async createConsumer({
    name,
    events,
  }: AddConsumerRequest): Promise<AddConsumerResponse> {
    const consumerId = randomUUID();
    const consumerKey = `${this.eventBrokerCfg.consumer_prefix}:${consumerId}`;

    await this.redisClient.json.set(consumerKey, '$', {
      name,
      events,
    });

    return {
      error: null,
      consumerId,
      status: 201,
    };
  }

  async createConsumerInGroup({
    streamKey,
    groupName,
    consumerId,
  }: CreateConsumerInGroupPayload) {
    await this.redisClient.xGroupCreateConsumer(
      streamKey,
      groupName,
      consumerId,
    );
  }

  async canConsumeEvent({
    producerName,
    consumerId,
    event,
  }: ConsumeEventRequestDto): Promise<true> {
    const consumer = (await this.redisClient.json.get(
      consumerId,
    )) as unknown as ConsumerIndex;

    if (!consumer)
      throw new RpcException(
        consumerServiceErrorMsgs.notRegistered(consumerId),
      );

    if (!consumer.events.includes(event))
      throw new RpcException(
        consumerServiceErrorMsgs.eventNotRegistered(consumerId, event),
      );

    return await this.producerService.canProduceEvent(producerName, event);
  }

  async getAllConsumers(): Promise<GetAllConsumersResponseDto> {
    const res = await this.redisClient.ft.search('idx:consumers', '*');

    const consumers = res.documents.map(
      ({ id, value }) => ({ id, ...value } as unknown as ConsumerResponseDto),
    );

    return {
      status: 200,
      error: null,
      consumers,
    };
  }

  private async streamReaderPromise(id: string) {
    return await this.redisClient.xRead(
      {
        key: this.streamKey,
        id,
      },
      {
        BLOCK: 1000,
      },
    );
  }

  private propagetId(id: string) {
    return zip(from(this.streamReaderPromise(id)), of(id));
  }

  consume(
    { event }: ConsumeEventRequestDto,
    call: ServerUnaryCall<ConsumeEventRequestDto, ConsumeEventResponseDto>,
  ): Observable<ConsumeEventResponseDto> {
    return new Observable<ConsumeEventResponseDto>((observer) => {
      const load = new BehaviorSubject('$');

      const subscription = load
        .pipe(
          mergeMap((id) => this.propagetId(id)),

          tap(([data, prev_id]: [StreamsMessagesReply, string]) => {
            const id = data !== null ? data[0].messages[0].id : prev_id;

            load.next(`${id}`);
          }),

          filter(([data]: [StreamsMessagesReply, string]) => data !== null),

          map(
            ([data]: [StreamsMessagesReply, string]) =>
              data as NonNullable<StreamsMessagesReply>,
          ),

          map(
            (data: NonNullable<StreamsMessagesReply>) =>
              data[0].messages[0].message as unknown as EventBrokerEvent,
          ),

          filter((data) => data.event === event),
        )
        .subscribe((data) => {
          observer.next({
            data: JSON.stringify(data, null, 2),
            error: null,
            status: 200,
          });
        });

      call.addListener('cancelled', () => {
        subscription.unsubscribe();
      });
    });
  }
}
