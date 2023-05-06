import { Module } from '@nestjs/common';

import { ProducerService } from './producer.service';
import { ProducerController } from './producer.controller';
import { RedisModule } from 'src/infrastucture/redis/redis.module';

@Module({
  imports: [RedisModule.register()],
  controllers: [ProducerController],
  providers: [ProducerService],
  exports: [ProducerService],
})
export class ProducerModule {}
