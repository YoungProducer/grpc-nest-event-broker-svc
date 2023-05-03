import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisClientType, createClient } from 'redis';
import { consumerSchema, producerSchema } from './schema';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly redisClient: RedisClientType;

  constructor() {
    this.redisClient = createClient();
  }

  async onModuleInit(): Promise<void> {
    await this.redisClient.connect();

    await this.initIndices();
  }

  async onModuleDestroy(): Promise<void> {
    await this.redisClient.quit();
  }

  private async initIndices(): Promise<void> {
    try {
      await Promise.all([
        await this.redisClient.ft.create('idx:producers', producerSchema, {
          ON: 'JSON',
          PREFIX: 'producer:',
        }),

        await this.redisClient.ft.create('idx:consumers', consumerSchema, {
          ON: 'JSON',
          PREFIX: 'consumer:',
        }),
      ]);
    } catch (e) {
      if (e.message === 'Index already exists') {
        console.log('Index exists already, skipped creation.');
      } else {
        console.error(e);
        process.exit(1);
      }
    }
  }

  getClient(): RedisClientType {
    return this.redisClient;
  }
}
