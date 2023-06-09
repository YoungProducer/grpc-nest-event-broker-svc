import { GrpcMethod } from '@nestjs/microservices';
import { ConsumerService } from './consumer.service';
import { Controller } from '@nestjs/common';

import { EVENT_BROKER_SERVICE_NAME } from 'src/proto/event-broker.pb';
import { GetAllConsumersResponseDto } from './dto/get-all-consumers.response.dto';
import { AddConsumerRequestDto } from './dto/add-consumer.request.dto';
import { AddConsumerResponseDto } from './dto/add-consumer.response.dto';

@Controller()
export class ConsumerController {
  constructor(private readonly consumerService: ConsumerService) {}

  @GrpcMethod(EVENT_BROKER_SERVICE_NAME, 'AddConsumer')
  async addConsumer(
    dto: AddConsumerRequestDto,
  ): Promise<AddConsumerResponseDto> {
    return await this.consumerService.createConsumer(dto);
  }

  @GrpcMethod(EVENT_BROKER_SERVICE_NAME, 'getAllConsumers')
  async getAllConsumers(): Promise<GetAllConsumersResponseDto> {
    return await this.consumerService.getAllConsumers();
  }
}
