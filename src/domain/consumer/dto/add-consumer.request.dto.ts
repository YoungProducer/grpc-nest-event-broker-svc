import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsString, NotContains } from 'class-validator';
import { AddConsumerRequest } from 'src/proto/event-broker.pb';

@Exclude()
export class AddConsumerRequestDto implements AddConsumerRequest {
  @Expose()
  @IsString()
  @IsNotEmpty({ each: true })
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
