import { Module } from '@nestjs/common';
import { RedisModule } from './infrastucture/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { ProducerModule } from './domain/producer/producer.module';
import { ConsumerModule } from './domain/consumer/consumer.module';

@Module({
  imports: [
    RedisModule,
    ProducerModule,
    ConsumerModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
