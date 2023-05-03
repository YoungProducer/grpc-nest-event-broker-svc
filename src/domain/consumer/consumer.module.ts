import { Module } from '@nestjs/common';
import { ConsumerController } from './consumer.controller';
import { ConsumerService } from './consumer.service';
import { RedisModule } from 'src/infrastucture/redis/redis.module';

@Module({
  imports: [RedisModule.register()],
  controllers: [ConsumerController],
  providers: [ConsumerService],
})
export class ConsumerModule {}
