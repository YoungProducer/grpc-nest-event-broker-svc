import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { RedisModule } from 'src/infrastucture/redis/redis.module';
import { ProducerModule } from '../producer/producer.module';
import { ConsumerModule } from '../consumer/consumer.module';
import { EventsService } from './events.service';

@Module({
  imports: [RedisModule.register(), ProducerModule, ConsumerModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
