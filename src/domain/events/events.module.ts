import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { RedisModule } from 'src/infrastucture/redis/redis.module';
import { ProducerModule } from '../producer/producer.module';
import { ConsumerModule } from '../consumer/consumer.module';
import { EventsService } from './events.service';
import { StreamsManagerModule } from '../streams-manager/streams-manager.module';

@Module({
  imports: [
    RedisModule.register(),
    ProducerModule,
    ConsumerModule,
    StreamsManagerModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
