import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType } from 'redis';
import { randomUUID } from 'node:crypto';

import {
  EnvVars,
  EventBrokerCfg,
} from 'src/config/interfaces/env-vars.interface';
import {
  AddProducerRequest,
  AddProducerResponse,
  GetAllProducersResponse,
  ProduceEventRequest,
  ProduceEventResponse,
} from 'src/proto/event-broker.pb';
import { ProducerResponseDto } from './dto/get-all-producers.response.dto';
import { DI_REDIS } from 'src/infrastucture/redis/constants';
import { RedisClientModuleGetter } from 'src/infrastucture/redis/interfaces';

@Injectable()
export class ProducerService implements OnModuleInit {
  private streamKey: string;
  private eventBrokerCfg: EventBrokerCfg;
  private redisClient: RedisClientType;

  constructor(
    private readonly configService: ConfigService<EnvVars>,

    @Inject(DI_REDIS)
    private readonly redisClientGetter: RedisClientModuleGetter,
  ) {}

  async onModuleInit(): Promise<void> {
    this.redisClient = await this.redisClientGetter();
    this.streamKey = this.configService.get<string>('events_stream_key');
    this.eventBrokerCfg =
      this.configService.get<EventBrokerCfg>('event_broker_cfg');
  }

  async createProducer({
    name,
    events,
  }: AddProducerRequest): Promise<AddProducerResponse> {
    const producerId = randomUUID();
    const producerKey = `${this.eventBrokerCfg.producer_prefix}:${producerId}`;

    await this.redisClient.json.set(producerKey, '$', {
      name,
      events,
    });

    return {
      error: null,
      producerId,
      status: 201,
    };
  }

  async getAllProducers(): Promise<GetAllProducersResponse> {
    const res = await this.redisClient.ft.search('idx:producers', '*');

    res.documents.forEach(console.log);

    const producers = res.documents.map(
      ({ id, value }) => ({ id, ...value } as unknown as ProducerResponseDto),
    );

    return {
      error: null,
      status: 200,
      producers,
    };
  }

  async produceEvent({
    producerId,
    data,
    event,
  }: ProduceEventRequest): Promise<ProduceEventResponse> {
    await this.redisClient.xAdd(this.streamKey, '*', {
      producerId,
      event,
      data,
    });

    return {
      status: 201,
      error: null,
    };
  }
}
