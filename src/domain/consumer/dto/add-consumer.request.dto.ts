import { Exclude, Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { AddConsumerRequest } from 'src/proto/event-broker.pb';

@Exclude()
export class AddConsumerRequestDto implements AddConsumerRequest {
  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString({ each: true })
  events: string[];
}
