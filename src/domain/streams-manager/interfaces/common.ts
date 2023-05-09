import { Worker } from 'node:worker_threads';

import { EventBrokerEvent } from 'src/types/event';
import { StreamKey } from './worker-data';

export type SubscribeCallback = (event: EventBrokerEvent) => void;

export type CallbacksMap = Map<string, SubscribeCallback>;

export type StreamListeners = Map<StreamKey, Map<string, SubscribeCallback>>;

export type ActiveStreams = Map<StreamKey, Worker>;
