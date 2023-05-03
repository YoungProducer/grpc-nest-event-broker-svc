import { Exclude, Expose } from 'class-transformer';
import { ConsumeEventResponse } from 'src/proto/event-broker.pb';

@Exclude()
export class ConsumeEventResponseDto implements ConsumeEventResponse {
  @Expose()
  status: number;

  @Expose()
  error: string;

  @Expose()
  data: string;
}
