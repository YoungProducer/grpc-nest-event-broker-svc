import { Exclude, Expose } from 'class-transformer';
import { ProduceEventResponse } from 'src/proto/event-broker.pb';

@Exclude()
export class ProduceEventResponseDto implements ProduceEventResponse {
  @Expose()
  status: number;

  @Expose()
  error: string;
}
