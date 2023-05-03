import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType } from 'redis';
import { randomUUID } from 'node:crypto';

import {
  EnvVars,
  EventBrokerCfg,
} from 'src/config/interfaces/env-vars.interface';
import { RedisService } from 'src/infrastucture/redis/redis.service';
import {
  AddConsumerRequest,
  AddConsumerResponse,
} from 'src/proto/event-broker.pb';
import {
  ConsumerResponseDto,
  GetAllConsumersResponseDto,
} from './dto/get-all-consumers.response.dto';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private redisClient: RedisClientType;
  private streamKey: string;
  private eventBrokerCfg: EventBrokerCfg;

  constructor(
    private readonly configService: ConfigService<EnvVars>,

    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    this.redisClient = this.redisService.getClient();
    this.streamKey = this.configService.get<string>('events_stream_key');
    this.eventBrokerCfg =
      this.configService.get<EventBrokerCfg>('event_broker_cfg');
  }

  async createConsumer({
    name,
    events,
  }: AddConsumerRequest): Promise<AddConsumerResponse> {
    const consumerId = randomUUID();
    const consumerKey = `${this.eventBrokerCfg.consumer_prefix}:${consumerId}`;

    await this.redisClient.json.set(consumerKey, '$', {
      name,
      events,
    });

    return {
      error: null,
      consumerId,
      status: 201,
    };
  }

  async getAllConsumers(): Promise<GetAllConsumersResponseDto> {
    const res = await this.redisClient.ft.search('idx:consumers', '*');

    const consumers = res.documents.map(
      ({ id, value }) => ({ id, ...value } as unknown as ConsumerResponseDto),
    );

    return {
      status: 200,
      error: null,
      consumers,
    };
  }
}
