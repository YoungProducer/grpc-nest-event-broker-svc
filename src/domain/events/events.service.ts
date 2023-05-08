import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';
import {
  BehaviorSubject,
  Observable,
  filter,
  from,
  map,
  mergeMap,
  tap,
  zip,
  of,
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

    await this.redisProducingClient.xAdd(
      this.getStreamKey(producerName, event),
      '*',
      { data },
    );

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

  private async getReadStream(streamKey: string, id: string) {
    return await this.redisConsumingClient.xRead(
      {
        key: streamKey,
        id,
      },
      {
        BLOCK: 1000,
        COUNT: 1,
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

    this.logger.log(
      'Consumer with ID: %s is now consuming event: %s.',
      consumerId,
      event,
    );

    const unsubscribeCombiner = combinerGenerator();

    const streamObserver = new Observable<ConsumeEventResponse>((observer) => {
      const load = new BehaviorSubject('$');

      const subscription = load
        .pipe(
          mergeMap((id) =>
            zip(
              from(
                this.getReadStream(this.getStreamKey(producerName, event), id),
              ),
              of(id),
            ),
          ),

          tap(async ([data, prev_id]: [StreamsMessagesReply, string]) => {
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
        )
        .subscribe(({ data }) =>
          observer.next({
            data,
            error: null,
            status: 200,
          }),
        );

      // "() => subscription.unsubscribe()" needs to save observer context
      unsubscribeCombiner.add(() => subscription.unsubscribe());
      unsubscribeCombiner.add(() =>
        this.logger.log(
          `Consumer with ID: %s has unsubscribed from event: %s`,
          consumerId,
          event,
        ),
      );
    });

    return {
      observer: streamObserver,
      unsubscribe: unsubscribeCombiner.execute,
    };
  }

  private getStreamKey(producerName: string, event: string): string {
    return `${producerName}:${event}`;
  }
}
