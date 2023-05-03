import { Exclude, Expose } from 'class-transformer';
import { AddConsumerResponse } from 'src/proto/event-broker.pb';

@Exclude()
export class AddConsumerResponseDto implements AddConsumerResponse {
  @Expose()
  status: number;

  @Expose()
  error: string;

  @Expose()
  consumerId: string;
}
