import { plainToInstance } from 'class-transformer';
import { AddConsumerRequestDto } from '../add-consumer.request.dto';
import { validate } from 'class-validator';

describe('DTO "AddProducerRequestDto"', () => {
  it('should not pass validation if at least one of event names has banned symbols', async () => {
    const testValue: AddConsumerRequestDto = {
      name: 'name',
      events: ['user created'],
    };

    const dtoInstance = plainToInstance(AddConsumerRequestDto, testValue);

    const errors = await validate(dtoInstance);

    expect(errors).not.toHaveLength(0);
  });

  it('should pass validation if data is correct', async () => {
    const testValue: AddConsumerRequestDto = {
      name: 'name',
      events: ['user_created'],
    };

    const dtoInstance = plainToInstance(AddConsumerRequestDto, testValue);

    const errors = await validate(dtoInstance);

    expect(errors).toHaveLength(0);
  });
});
