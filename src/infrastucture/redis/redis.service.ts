import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient } from '@redis/client';
import { RedisClientType } from 'redis';
import { consumerSchema, producerSchema } from './schema';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly redisClient: RedisClientType;

  constructor() {
    this.redisClient = createClient();
  }

  async onModuleInit(): Promise<void> {
    await this.redisClient.connect();

    await this.redisClient.ft.create('idx:producers', producerSchema, {
      ON: 'JSON',
      PREFIX: 'producer:',
    });

    await this.redisClient.ft.create('idx:consumers', consumerSchema, {
      ON: 'JSON',
      PREFIX: 'consumer:',
    });
  }

  getClient(): RedisClientType {
    return this.redisClient;
  }
}
