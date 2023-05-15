import { Injectable } from '@nestjs/common';

import {
  Event,
  SubscribeCallback,
  DetailedEventsCallbaksMap,
  EventsCallbaksMap,
  ConsumerCallbacksMap,
} from './interfaces/common';
import { combinerGenerator } from 'src/utils/combine-functions';
import { SubscribeToCallbackPayload } from './interfaces/subscribe-to-event.interface';
import { ProduceEventPayload } from './interfaces/produce-event.interface';
import { UnsubscribeFromEventPayload } from './interfaces/unsubscribe-from-event.interface';

@Injectable()
export class StreamService {
  private eventsCallbacks: EventsCallbaksMap = new Map();
  private detailedEventsCallbaksMap: DetailedEventsCallbaksMap = new Map();

  public produceEvent({ event, data }: ProduceEventPayload) {
    const callback = this.eventsCallbacks.get(event);

    if (!callback) return;

    callback({ data });
  }

  public subscribeToEvent({
    event,
    consumerName,
    callback,
  }: SubscribeToCallbackPayload) {
    this.addCallback({ event, consumerName, callback });

    this.updateCallback(event);
  }

  public unsubscribeFromEvent({
    event,
    consumerName,
  }: UnsubscribeFromEventPayload) {
    this.removeCallback({ event, consumerName });

    this.updateCallback(event);
  }

  private addCallback({
    event,
    consumerName,
    callback,
  }: SubscribeToCallbackPayload) {
    const consumersCallbacks: ConsumerCallbacksMap =
      this.detailedEventsCallbaksMap.get(event) || new Map();

    consumersCallbacks.set(consumerName, callback);

    this.detailedEventsCallbaksMap.set(event, consumersCallbacks);
  }

  private removeCallback({ event, consumerName }: UnsubscribeFromEventPayload) {
    this.detailedEventsCallbaksMap.get(event).delete(consumerName);
  }

  private updateCallback(event: Event) {
    const consumersCallbacks = this.detailedEventsCallbaksMap.get(event);

    if (consumersCallbacks.size === 0) {
      this.eventsCallbacks.delete(event);
      return;
    }

    const callbackCombiner = combinerGenerator<SubscribeCallback>();

    consumersCallbacks.forEach((cb) => {
      callbackCombiner.add(cb);
    });

    this.eventsCallbacks.set(event, callbackCombiner.execute);
  }
}
