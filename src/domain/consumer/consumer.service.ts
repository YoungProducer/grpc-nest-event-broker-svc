import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType } from 'redis';
import { randomUUID } from 'node:crypto';

import {
  EnvVars,
  EventBrokerCfg,
} from 'src/config/interfaces/env-vars.interface';
import {
  AddConsumerRequest,
  AddConsumerResponse,
} from 'src/proto/event-broker.pb';
import {
  ConsumerResponseDto,
  GetAllConsumersResponseDto,
} from './dto/get-all-consumers.response.dto';
import { DI_REDIS } from 'src/infrastucture/redis/constants';
import { RedisClientModuleGetter } from 'src/infrastucture/redis/interfaces';
import { CreateConsumerInGroupPayload } from './interfaces/create-consumer-in-group';
import { ProducerService } from '../producer/producer.service';
import { ConsumerIndex } from './interfaces/consumer-index';
import { RpcException } from '@nestjs/microservices';
import { consumerServiceErrorMsgs } from './constants/error-messages';
import { DeleteConsumerFromGroupPayload } from './interfaces/delete-consumer-from-group';
import { ConsumeEventRequestDto } from '../events/dto/consume-event.request.dto';
import { getOccurenciesNumber } from '../../utils/get-occurencies-number';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private streamKey: string;
  private eventBrokerCfg: EventBrokerCfg;
  private redisClient: RedisClientType;
  private readonly logger = new Logger(ConsumerService.name);

  constructor(
    private readonly configService: ConfigService<EnvVars>,
    private readonly producerService: ProducerService,
    @Inject(DI_REDIS)
    private readonly redisClientGetter: RedisClientModuleGetter,
  ) {}

  async onModuleInit(): Promise<void> {
    this.redisClient = await this.redisClientGetter();
    this.streamKey = this.configService.get<string>('events_stream_key');
    this.eventBrokerCfg =
      this.configService.get<EventBrokerCfg>('event_broker_cfg');
  }

  async createConsumer({
    name,
    events,
  }: AddConsumerRequest): Promise<AddConsumerResponse> {
    const isConsumerRegistered = await this.isConsumerRegistered(name);

    if (isConsumerRegistered) {
      const errorMessage = consumerServiceErrorMsgs.alreadyRegistered(name);

      this.logger.error(errorMessage);

      return {
        status: 400,
        error: errorMessage,
        consumerId: null,
      };
    }

    const consumerId = randomUUID();
    const consumerKey = this.getConsumerJSONKey(consumerId);

    await this.redisClient.json.set(consumerKey, '$', {
      name,
      events,
    });

    this.logger.log(
      'Consumer was registered with name: %s and id: %s. Subscribed for events: %s.',
      name,
      consumerId,
      events.join(', '),
    );

    return {
      error: null,
      consumerId,
      status: 201,
    };
  }

  async createConsumerInGroup({
    streamKey,
    groupName,
    consumerId,
  }: CreateConsumerInGroupPayload) {
    await this.redisClient.xGroupCreateConsumer(
      streamKey,
      groupName,
      consumerId,
    );
  }

  async deleteConsumerFromGroup({
    streamKey,
    consumerId,
    groupName,
  }: DeleteConsumerFromGroupPayload): Promise<void> {
    await this.redisClient.xGroupDelConsumer(streamKey, groupName, consumerId);
  }

  async canConsumeEvent({
    producerName,
    consumerId,
    event,
  }: ConsumeEventRequestDto): Promise<true> {
    const consumer = (await this.redisClient.json.get(
      this.getConsumerJSONKey(consumerId),
    )) as unknown as ConsumerIndex;

    if (!consumer)
      throw new RpcException(
        consumerServiceErrorMsgs.notRegistered(consumerId),
      );

    if (!consumer.events.includes(event))
      throw new RpcException(
        consumerServiceErrorMsgs.eventNotRegistered(consumerId, event),
      );

    return await this.producerService.canProduceEvent(producerName, event);
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

  async isConsumerRegistered(nameOrId: string): Promise<ConsumerIndex | false> {
    // 4 is number of '-' in UUID
    const isId = getOccurenciesNumber(nameOrId, '-') === 4;

    // if value is id then try to get from json by id
    if (isId) {
      const consumer = await this.redisClient.json.get(
        this.getConsumerJSONKey(nameOrId),
      );

      return (consumer as unknown as ConsumerIndex) ?? false;
    }

    // if value is not id search by producer's name
    const searchRes = await this.redisClient.ft.search(
      'idx:consumers',
      `@name:${nameOrId}`,
    );

    if (searchRes.total === 0) return false;

    return searchRes.documents[0].value as unknown as ConsumerIndex;
  }

  private getConsumerJSONKey(id: string): string {
    return `${this.eventBrokerCfg.consumer_prefix}:${id}`;
  }
}
