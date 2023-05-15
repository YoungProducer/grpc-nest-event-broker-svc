import { Event, SubscribeCallback } from './common';

export interface SubscribeToCallbackPayload {
  event: Event;
  consumerName: string;
  callback: SubscribeCallback;
}
