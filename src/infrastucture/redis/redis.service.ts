import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient } from '@redis/client';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly redisClient: RedisClientType;

  constructor() {
    this.redisClient = createClient();
  }

  async onModuleInit(): Promise<void> {
    await this.redisClient.connect();
  }

  getClient(): RedisClientType {
    return this.redisClient;
  }
}
