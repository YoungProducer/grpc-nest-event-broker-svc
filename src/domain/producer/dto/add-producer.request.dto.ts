import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsString, NotContains } from 'class-validator';
import { AddProducerRequest } from 'src/proto/event-broker.pb';

@Exclude()
export class AddProducerRequestDto implements AddProducerRequest {
  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Expose()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @NotContains(' ', {
    each: true,
    message: ({ value }) => `Event "${value}" includes space`,
  })
  events: string[];
}
