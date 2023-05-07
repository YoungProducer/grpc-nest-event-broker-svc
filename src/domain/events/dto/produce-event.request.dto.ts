import { Exclude, Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { ProduceEventRequest } from 'src/proto/event-broker.pb';

@Exclude()
export class ProduceEventRequestDto implements ProduceEventRequest {
  @Expose()
  @IsString()
  producerName: string;

  @Expose()
  @IsString()
  event: string;

  @Expose()
  @IsString()
  data: string;
}
