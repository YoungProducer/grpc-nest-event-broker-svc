import { DynamicModule, Module, Provider } from '@nestjs/common';
import { DI_REDIS } from './constants';
import { RedisClientType, createClient } from 'redis';
import { producerSchema, consumerSchema } from './schema';
import { RedisClientModuleGetter } from './interfaces';

const redisFactory = (): Provider => ({
  provide: DI_REDIS,
  useFactory: (): RedisClientModuleGetter => {
    return async () => {
      const client = createClient();

      await client.connect();

      try {
        await Promise.all([
          await client.ft.create('idx:producers', producerSchema, {
            ON: 'JSON',
            PREFIX: 'producer:',
          }),

          await client.ft.create('idx:consumers', consumerSchema, {
            ON: 'JSON',
            PREFIX: 'consumer:',
          }),
        ]);

        return client as RedisClientType;
      } catch (e) {
        if (e.message === 'Index already exists') {
          console.log('Index exists already, skipped creation.');
          return client as RedisClientType;
        } else {
          console.error(e);
          process.exit(1);
        }
      }
    };
  },
});

@Module({})
export class RedisModule {
  static register(): DynamicModule {
    const provider = redisFactory();

    return {
      module: RedisModule,
      providers: [provider],
      exports: [provider],
    };
  }
}
