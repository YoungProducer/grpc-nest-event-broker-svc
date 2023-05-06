import { Module } from '@nestjs/common';
import { ConsumerController } from './consumer.controller';
import { ConsumerService } from './consumer.service';
import { RedisModule } from 'src/infrastucture/redis/redis.module';
import { ProducerModule } from '../producer/producer.module';

@Module({
  imports: [RedisModule.register(), ProducerModule],
  controllers: [ConsumerController],
  providers: [ConsumerService],
  exports: [ConsumerService],
})
export class ConsumerModule {}
