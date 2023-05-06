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
import { getOccurenciesNumber } from 'src/utils/get-occurencies-number';
import { ProducerIndex } from './interfaces/producer-index';

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
    const isRegistered = await this.isProducerRegistered(name);

    if (isRegistered) {
      return {
        error: 'Producer already exist',
        producerId: null,
        status: 400,
      };
    }

    // create all groups based on events that producer can generate
    await Promise.allSettled(
      events.map((event) => this.createGroup(name, event)),
    );

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

  // makes a consumer's group with given params
  // and creates a stream if it doesn't exist
  // most of the time the "streamKey" should be a "producerId"
  // and "groupName" an "event" name
  async createGroup(streamKey: string, groupName: string): Promise<void> {
    try {
      await this.redisClient.xGroupCreate(streamKey, groupName, '0', {
        MKSTREAM: true,
      });
    } catch (e) {
      console.error(e);
    }
  }

  async isProducerRegistered(nameOrId: string): Promise<ProducerIndex | false> {
    // 4 is number of '-' in UUID
    const isId = getOccurenciesNumber(nameOrId, '-') === 4;

    // if value is id then try to get from json by id
    if (isId) {
      const producer = await this.redisClient.json.get(nameOrId);

      return (producer as unknown as ProducerIndex) ?? false;
    }

    // if value is not id search by producer's name
    const searchRes = await this.redisClient.ft.search(
      'idx:producers',
      nameOrId,
    );

    if (searchRes.total === 0) return false;

    return searchRes.documents[0].value as unknown as ProducerIndex;
  }

  async canProduceEvent(id: string, event: string) {
    const producer = await this.isProducerRegistered(id);

    if (!producer) return false;

    return producer.events.includes(event);
  }

  async getAllProducers(): Promise<GetAllProducersResponse> {
    const res = await this.redisClient.ft.search('idx:producers', '*');

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