import { MessagePort } from 'node:worker_threads';

export type StreamKey = string;

export interface WorkerData {
  port: MessagePort;
  aliasModule: string;
  streamKey: StreamKey;
}
