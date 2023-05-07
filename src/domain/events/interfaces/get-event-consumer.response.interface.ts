import { Observable } from 'rxjs';
import { ConsumeEventResponse } from 'src/proto/event-broker.pb';

export interface GetEventConsumerResult {
  observer: Observable<ConsumeEventResponse>;
  unsubscribe: () => void;
}
