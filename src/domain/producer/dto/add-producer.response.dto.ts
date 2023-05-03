import { Exclude, Expose } from 'class-transformer';
import { AddProducerResponse } from 'src/proto/event-broker.pb';

@Exclude()
export class AddProducerResponseDto implements AddProducerResponse {
  @Expose()
  producerId: string;

  @Expose()
  status: number;

  @Expose()
  error: string | null;
}
