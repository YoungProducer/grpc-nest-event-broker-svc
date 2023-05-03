import { Exclude, Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { AddProducerRequest } from 'src/proto/event-broker.pb';

@Exclude()
export class AddProducerRequestDto implements AddProducerRequest {
  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString({ each: true })
  events: string[];
}
