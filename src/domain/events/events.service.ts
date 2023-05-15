import { Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

import {
  ConsumeEventRequest,
  ConsumeEventResponse,
  ProduceEventRequest,
  ProduceEventResponse,
} from 'src/proto/event-broker.pb';
import { EventBrokerEvent } from 'src/types/event';
import { ProducerService } from '../producer/producer.service';
import { GetStreamObserverReturn } from './interfaces/get-stream-observer-result';
import { StreamService } from '../stream/stream.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly producerService: ProducerService,
    private readonly streamService: StreamService,
  ) {}

  async produceEvent({
    data,
    event,
    producerName,
  }: ProduceEventRequest): Promise<ProduceEventResponse> {
    await this.producerService.canProduceEvent(producerName, event);

    this.streamService.produceEvent({ event, data });

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
    consumerName,
    event,
  }: ConsumeEventRequest): GetStreamObserverReturn {
    const observable = new Observable<ConsumeEventResponse>((observer) => {
      const callback = ({ data }: EventBrokerEvent) => {
        observer.next({
          data,
          error: null,
          status: 200,
        });
      };

      this.streamService.subscribeToEvent({ event, consumerName, callback });
    });

    const unsubscribe = () =>
      this.streamService.unsubscribeFromEvent({ event, consumerName });

    return { observable, unsubscribe };
  }
}
