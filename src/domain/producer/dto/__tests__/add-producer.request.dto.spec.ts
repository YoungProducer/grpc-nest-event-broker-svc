import { plainToInstance } from 'class-transformer';
import { AddProducerRequestDto } from '../add-producer.request.dto';
import { validate } from 'class-validator';

describe('DTO "AddProducerRequestDto"', () => {
  it('should not pass validation if at least one of event names has banned symbols', async () => {
    const testValue: AddProducerRequestDto = {
      name: 'name',
      events: ['user created'],
    };

    const dtoInstance = plainToInstance(AddProducerRequestDto, testValue);

    const errors = await validate(dtoInstance);

    expect(errors).not.toHaveLength(0);
  });

  it('should pass validation if data is correct', async () => {
    const testValue: AddProducerRequestDto = {
      name: 'name',
      events: ['user_created'],
    };

    const dtoInstance = plainToInstance(AddProducerRequestDto, testValue);

    const errors = await validate(dtoInstance);

    expect(errors).toHaveLength(0);
  });
});
