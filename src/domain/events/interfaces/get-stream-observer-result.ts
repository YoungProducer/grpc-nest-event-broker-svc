import { Observable } from 'rxjs';
import { ConsumeEventResponse } from 'src/proto/event-broker.pb';

export interface GetStreamObserverReturn {
  observable: Observable<ConsumeEventResponse>;
  unsubscribe: () => void;
}
