import { Exclude, Expose, Type } from 'class-transformer';
import {
  GetAllProducersResponse,
  GetAllProducersResponse_Producer,
} from 'src/proto/event-broker.pb';

export class ProducerResponseDto implements GetAllProducersResponse_Producer {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  events: string[];
}

@Exclude()
export class GetAllProducersResponseDto implements GetAllProducersResponse {
  @Expose()
  @Type(() => ProducerResponseDto)
  producers: GetAllProducersResponse_Producer[];

  @Expose()
  status: number;

  @Expose()
  error: string | null;
}
