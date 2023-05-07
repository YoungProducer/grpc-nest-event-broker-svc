import { Module } from '@nestjs/common';
import { RedisModule } from './infrastucture/redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { ProducerModule } from './domain/producer/producer.module';
import { ConsumerModule } from './domain/consumer/consumer.module';
import { EventsModule } from './domain/events/events.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    RedisModule,
    ProducerModule,
    ConsumerModule,
    EventsModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        // install 'pino-pretty' package in order to use the following option
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,

        // and all the other fields of:
        // - https://github.com/pinojs/pino-http#api
        // - https://github.com/pinojs/pino/blob/HEAD/docs/api.md#options-object
      },
    }),
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
