import { Exclude, Expose, Type } from 'class-transformer';
import {
  GetAllConsumersResponse,
  GetAllConsumersResponse_Consumer,
} from 'src/proto/event-broker.pb';

export class ConsumerResponseDto implements GetAllConsumersResponse_Consumer {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  events: string[];
}

@Exclude()
export class GetAllConsumersResponseDto implements GetAllConsumersResponse {
  @Expose()
  @Type(() => ConsumerResponseDto)
  consumers: ConsumerResponseDto[];

  @Expose()
  status: number;

  @Expose()
  error: string | null;
}
