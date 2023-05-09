import { parentPort, workerData as wd } from 'node:worker_threads';
import {
  BehaviorSubject,
  mergeMap,
  zip,
  from,
  of,
  tap,
  filter,
  map,
} from 'rxjs';
import { createClient } from 'redis';

import { StreamsMessagesReply } from 'src/types/redis-types';
import { EventBrokerEvent } from 'src/types/event';
import { WorkerData } from '../interfaces/worker-data';
import { NewStreamEntryEvent } from '../interfaces/messages';

const { streamKey, port }: WorkerData = wd;

const redisClient = createClient();

redisClient.connect().then(() => listen());

async function getReadStream(streamKey: string, id: string) {
  return await redisClient.xRead(
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

const load = new BehaviorSubject('$');

function listen() {
  const subscription = load
    .pipe(
      mergeMap((id) => zip(from(getReadStream(streamKey, id)), of(id))),

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
    .subscribe(({ data }) => {
      const message: NewStreamEntryEvent = {
        type: 'new_entry',
        data,
      };

      port.postMessage(message);
    });

  parentPort.on('close', () => {
    subscription.unsubscribe();
  });
}
