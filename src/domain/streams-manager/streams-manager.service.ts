import { Injectable, Logger } from '@nestjs/common';
import { resolve } from 'node:path';
import { Worker, MessageChannel } from 'node:worker_threads';

import {
  StreamListeners,
  CallbacksMap,
  SubscribeCallback,
  ActiveStreams,
} from './interfaces/common';
import { StreamKey, WorkerData } from './interfaces/worker-data';
import { combinerGenerator } from 'src/utils/combine-functions';
import { streamManagerErrorMsgs } from './constants/error-messages';
import { NewStreamEntryEvent } from './interfaces/messages';

@Injectable()
export class StreamsManagerService {
  private readonly workerFileName = 'read-stream.worker';

  private activeStreams: ActiveStreams = new Map<StreamKey, Worker>();
  private streamListeners: StreamListeners = new Map<StreamKey, CallbacksMap>();

  private readonly logger = new Logger(StreamsManagerService.name);

  public subscribe(
    streamKey: StreamKey,
    consumerId: string,
    callback: SubscribeCallback,
  ) {
    this.logger.log(
      `Consumer with id: ${consumerId} subscribed to stream: ${streamKey}`,
    );

    // if stream was not consumed yet
    // then we create a new worker which starts listen
    // redis stream
    if (!this.activeStreams.has(streamKey)) {
      const worker = this.createWorker(streamKey);

      this.activeStreams.set(streamKey, worker);
    }

    // added new callback to callbacks map for specific stream
    this.updateStreamListener(streamKey, consumerId, callback);
  }

  public unsubscribe(streamKey: StreamKey, consumerId: string) {
    this.logger.log(
      `Consumer with id: ${consumerId} unsubscribed from stream: ${streamKey}`,
    );

    // remove callback from stream listeners
    const result = this.removeStreamListener(streamKey, consumerId);

    // check whether result is error
    if (typeof result === 'string') {
      return;
    }

    // if some subscribers still listens to stream just return
    // because there is nothing we need to do
    if (result > 0) return;

    // if there are no subscribers anymore
    // then delete this entry from streamListeners map
    this.streamListeners.delete(streamKey);

    // get worker that was dedicated to this stream
    const worker = this.activeStreams.get(streamKey);

    // terminate it
    worker.terminate();

    // remove worker from activeStreams map
    // so in case of resubscribe we create a new worker
    this.activeStreams.delete(streamKey);
  }

  // returns either error message or number of subscribers that still listens to it
  private removeStreamListener(
    streamKey: StreamKey,
    consumerId: string,
  ): string | number {
    // check whether there are any stream listeners of specific stream
    if (!this.streamListeners.has(streamKey)) {
      return streamManagerErrorMsgs.noListeners(streamKey);
    }

    const callbacksMap = this.streamListeners.get(streamKey);

    // check whether callback was added for consumer with key: consumerId
    if (!callbacksMap.has(consumerId)) {
      return streamManagerErrorMsgs.invalidConsumer(streamKey, consumerId);
    }

    // delete callback
    callbacksMap.delete(consumerId);

    // update callbacks
    this.streamListeners.set(streamKey, callbacksMap);

    // return number of subscribers that are still listening to current stream
    return callbacksMap.size;
  }

  private updateStreamListener(
    streamKey: StreamKey,
    consumerId: string,
    callback: SubscribeCallback,
  ) {
    let callbacksMap: CallbacksMap;

    if (!this.streamListeners.has(streamKey)) {
      // if there are not any subscribers of this stream yet
      // then create a new callbacksMap
      callbacksMap = new Map();
    } else {
      // if there are, then assign existing one
      callbacksMap = this.streamListeners.get(streamKey);
    }

    // add/update callback for consumer with given id(consumerId)
    callbacksMap.set(consumerId, callback);

    // update main Map(streamListeners)
    this.streamListeners.set(streamKey, callbacksMap);
  }

  private createWorker(streamKey: StreamKey): Worker {
    // create a new channel for each worker
    const channel = new MessageChannel();

    // prepare worker's data
    // we passing port in 'workerData'
    // so we won't to specify it later
    // and it simplifies "worker code and implementantion"
    const workerData: WorkerData = {
      aliasModule: this.getTSWorkerPath(),
      port: channel.port1,
      streamKey,
    };

    // necessarily pass "channel.port1" to "transferList"
    // so it won't be copied
    const worker = new Worker(this.getJSWorkerPath(), {
      workerData,
      transferList: [channel.port1],
    });

    channel.port2.on('message', (value) => {
      this.messagesHandler(streamKey, value);
    });

    return worker;
  }

  private messagesHandler(streamKey: StreamKey, message: any) {
    if (this.isNewStreamEntryMessage(message)) {
      const callback = this.getCallback(streamKey);

      callback(message);
    }
  }

  // type guard
  private isNewStreamEntryMessage(
    message: NewStreamEntryEvent,
  ): message is NewStreamEntryEvent {
    return message.type === 'new_entry';
  }

  private getCallback(streamKey: StreamKey): SubscribeCallback {
    // get all stream listeners for specified stream
    const callbacksMap = this.streamListeners.get(streamKey);

    const callbacksCombiner = combinerGenerator<SubscribeCallback>();

    // add all callbacks to combiner
    callbacksMap.forEach((value) => {
      callbacksCombiner.add(value);
    });

    // return function which should be executed when new data appears in the stream
    return callbacksCombiner.execute;
  }

  private getTSWorkerPath(): string {
    return resolve(__dirname, 'workers', `${this.workerFileName}.ts`);
  }

  private getJSWorkerPath(): string {
    return resolve(__dirname, 'workers', `${this.workerFileName}.js`);
  }
}
