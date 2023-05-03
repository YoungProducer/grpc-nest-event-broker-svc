import { Module } from '@nestjs/common';
import { RedisModule } from './infrastucture/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { ProducerModule } from './domain/producer/producer.module';

@Module({
  imports: [
    RedisModule,
    ProducerModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
