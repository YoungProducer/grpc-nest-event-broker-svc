import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';
import {
  BehaviorSubject,
  Observable,
  filter,
  from,
  map,
  mergeMap,
  of,
  tap,
  zip,
} from 'rxjs';

import {
  ConsumeEventRequest,
  ConsumeEventResponse,
  ProduceEventRequest,
  ProduceEventResponse,
} from 'src/proto/event-broker.pb';
import { DI_REDIS } from 'src/infrastucture/redis/constants';
import { RedisClientModuleGetter } from 'src/infrastucture/redis/interfaces';
import { EventBrokerEvent } from 'src/types/event';
import { StreamsMessagesReply } from 'src/types/redis-types';
import { ConsumerService } from '../consumer/consumer.service';
import { ProducerService } from '../producer/producer.service';
import { GetReadStreamPayload } from './interfaces/get-read-stream-payload.interface';
import { GetEventConsumerResult } from './interfaces/get-event-consumer.response.interface';
import { combinerGenerator } from '../../utils/combine-functions';

@Injectable()
export class EventsService implements OnModuleInit {
  private redisConsumingClient: RedisClientType;
  private redisProducingClient: RedisClientType;
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly consumerService: ConsumerService,
    private readonly producerService: ProducerService,
    @Inject(DI_REDIS)
    private readonly redisClientGetter: RedisClientModuleGetter,
  ) {}

  async onModuleInit(): Promise<void> {
    this.redisConsumingClient = await this.redisClientGetter();
    this.redisProducingClient = await this.redisClientGetter();
  }

  async produceEvent({
    data,
    event,
    producerName,
  }: ProduceEventRequest): Promise<ProduceEventResponse> {
    await this.producerService.canProduceEvent(producerName, event);

    await this.redisProducingClient.xAdd(producerName, '*', { data });

    this.logger.log(
      'Event %s was producer by producer: %s',
      event,
      producerName,
    );

    return {
      status: 200,
      error: null,
    };
  }

  private async getReadStream({
    streamKey,
    id,
    group,
    consumerId,
  }: GetReadStreamPayload) {
    return await this.redisConsumingClient.xReadGroup(
      group,
      consumerId,
      {
        key: streamKey,
        id,
      },
      {
        BLOCK: 1000,
      },
    );
  }

  async getEventConsumer({
    producerName,
    consumerId,
    event,
  }: ConsumeEventRequest): Promise<GetEventConsumerResult> {
    await this.consumerService.canConsumeEvent({
      producerName,
      consumerId,
      event,
    });

    await this.consumerService.createConsumerInGroup({
      streamKey: producerName,
      groupName: event,
      consumerId,
    });

    this.logger.log(
      'Consumer with ID: %s is now consuming event: %s.',
      consumerId,
      event,
    );

    const delConsumer = async () => {
      await this.consumerService.deleteConsumerFromGroup({
        streamKey: producerName,
        groupName: event,
        consumerId,
      });

      this.logger.log(
        `Consumer with ID: %s has unsubscribed from group: %s`,
        consumerId,
        event,
      );
    };

    const unsubscribeCombiner = combinerGenerator();

    const streamObserver = new Observable<ConsumeEventResponse>((observer) => {
      const load = new BehaviorSubject('>');

      const subscription = load
        .pipe(
          mergeMap((id) =>
            zip(
              from(
                this.getReadStream({
                  streamKey: producerName,
                  consumerId,
                  id,
                  group: event,
                }),
              ),
              of(id),
            ),
          ),

          tap(async ([data, prev_id]: [StreamsMessagesReply, string]) => {
            this.logger.log(
              `data: ${JSON.stringify(data)}, prev_id: ${prev_id}`,
            );
            if (data) {
              this.logger.log(`messages: ${JSON.stringify(data[0].messages)}`);
            }

            const entryId = data && data[0]?.messages[0]?.id;

            if (entryId) {
              await this.redisConsumingClient.xAck(
                producerName,
                event,
                entryId,
              );
            }

            load.next(`>`);
          }),

          filter(([data]: [StreamsMessagesReply, string]) => data !== null),

          map(
            ([data]: [StreamsMessagesReply, string]) =>
              data as NonNullable<StreamsMessagesReply>,
          ),

          filter((data) => data[0].messages.length > 0),

          map(
            (data: NonNullable<StreamsMessagesReply>) =>
              data[0].messages[0].message as unknown as EventBrokerEvent,
          ),
        )
        .subscribe(({ data }) =>
          observer.next({
            data,
            error: null,
            status: 200,
          }),
        );

      unsubscribeCombiner.add(() => subscription.unsubscribe());
      unsubscribeCombiner.add(delConsumer);
    });

    return {
      observer: streamObserver,
      unsubscribe: unsubscribeCombiner.execute,
    };
  }
}
