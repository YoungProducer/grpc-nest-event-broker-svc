import { EventBrokerEvent } from 'src/types/event';

export type Event = string;

export type SubscribeCallback = (value: EventBrokerEvent) => void;

// Contains combined callback of all consumers' callbacks per event
export type EventsCallbaksMap = Map<Event, SubscribeCallback>;

// Containts callbacks mapping per each consumer
// So we can remove or add callback
export type ConsumerCallbacksMap = Map<string, SubscribeCallback>;

export type DetailedEventsCallbaksMap = Map<Event, ConsumerCallbacksMap>;
