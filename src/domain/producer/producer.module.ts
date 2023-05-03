import { Module } from '@nestjs/common';

import { ProducerService } from './producer.service';
import { ProducerController } from './producer.controller';
import { RedisModule } from 'src/infrastucture/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [ProducerController],
  providers: [ProducerService],
})
export class ProducerModule {}
