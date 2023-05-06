import { Exclude, Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { ConsumeEventRequest } from 'src/proto/event-broker.pb';

@Exclude()
export class ConsumeEventRequestDto implements ConsumeEventRequest {
  @Expose()
  @IsString()
  event: string;

  @Expose()
  @IsString()
  producerName: string;

  @Expose()
  @IsString()
  consumerId: string;
}
