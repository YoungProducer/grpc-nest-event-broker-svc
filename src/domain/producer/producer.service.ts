import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
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
} from 'src/proto/event-broker.pb';
import { ProducerResponseDto } from './dto/get-all-producers.response.dto';
import { DI_REDIS } from 'src/infrastucture/redis/constants';
import { RedisClientModuleGetter } from 'src/infrastucture/redis/interfaces';
import { getOccurenciesNumber } from 'src/utils/get-occurencies-number';
import { ProducerIndex } from './interfaces/producer-index';
import { producerServiceErrorMsgs } from './constants/error-messages';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProducerService implements OnModuleInit {
  private streamKey: string;
  private eventBrokerCfg: EventBrokerCfg;
  private redisClient: RedisClientType;
  private readonly logger = new Logger(ProducerService.name);

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
      const errorMessage = producerServiceErrorMsgs.alreadyRegistered(name);

      this.logger.error(errorMessage);

      return {
        error: errorMessage,
        producerId: null,
        status: 400,
      };
    }

    const producerId = randomUUID();
    const producerKey = this.getProducerJSONKey(producerId);

    await this.redisClient.json.set(producerKey, '$', {
      name,
      events,
    });

    this.logger.log(
      'Producer was registered with name: %s and id: %s. Might produce events: %s.',
      name,
      producerId,
      events.join(', '),
    );

    return {
      error: null,
      producerId,
      status: 201,
    };
  }

  async isProducerRegistered(nameOrId: string): Promise<ProducerIndex | false> {
    // 4 is number of '-' in UUID
    const isId = getOccurenciesNumber(nameOrId, '-') === 4;

    // if value is id then try to get from json by id
    if (isId) {
      const producer = await this.redisClient.json.get(
        this.getProducerJSONKey(nameOrId),
      );

      return (producer as unknown as ProducerIndex) ?? false;
    }

    // if value is not id search by producer's name
    const searchRes = await this.redisClient.ft.search(
      'idx:producers',
      `@name:${nameOrId}`,
    );

    if (searchRes.total === 0) return false;

    return searchRes.documents[0].value as unknown as ProducerIndex;
  }

  // returns "true" if producer can produce event
  // returns "string" as reason if can't
  async canProduceEvent(nameOrId: string, event: string): Promise<true> {
    // 4 is number of '-' in UUID
    const isId = getOccurenciesNumber(nameOrId, '-') === 4;

    const producer = await this.isProducerRegistered(nameOrId);

    if (!producer)
      throw new RpcException(
        producerServiceErrorMsgs.notRegistered(nameOrId, isId),
      );

    if (!producer.events.includes(event))
      throw new RpcException(
        producerServiceErrorMsgs.cannotProduceThisEvent(event),
      );

    return true;
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

  private getProducerJSONKey(id: string): string {
    return `${this.eventBrokerCfg.producer_prefix}:${id}`;
  }
}
