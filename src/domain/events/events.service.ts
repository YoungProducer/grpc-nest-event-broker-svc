import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { Observable } from 'rxjs';

import {
  ConsumeEventRequest,
  ConsumeEventResponse,
  ProduceEventRequest,
  ProduceEventResponse,
} from 'src/proto/event-broker.pb';
import { DI_REDIS } from 'src/infrastucture/redis/constants';
import { RedisClientModuleGetter } from 'src/infrastucture/redis/interfaces';
import { EventBrokerEvent } from 'src/types/event';
import { ProducerService } from '../producer/producer.service';
import { StreamsManagerService } from '../streams-manager/streams-manager.service';
import { GetStreamObserverReturn } from './interfaces/get-stream-observer-result';

@Injectable()
export class EventsService implements OnModuleInit {
  private redisProducingClient: RedisClientType;
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly streamsManagerService: StreamsManagerService,
    private readonly producerService: ProducerService,
    @Inject(DI_REDIS)
    private readonly redisClientGetter: RedisClientModuleGetter,
  ) {}

  async onModuleInit(): Promise<void> {
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

  public getStreamObserver({
    consumerId,
    event,
    producerName,
  }: ConsumeEventRequest): GetStreamObserverReturn {
    const streamKey = this.getStreamKey(producerName, event);

    const observable = new Observable<ConsumeEventResponse>((observer) => {
      const callback = ({ data }: EventBrokerEvent) => {
        observer.next({
          data,
          error: null,
          status: 200,
        });
      };

      this.streamsManagerService.subscribe(streamKey, consumerId, callback);
    });

    const unsubscribe = () =>
      this.streamsManagerService.unsubscribe(streamKey, consumerId);

    return { observable, unsubscribe };
  }

  private getStreamKey(producerName: string, event: string): string {
    return `${producerName}:${event}`;
  }
}
