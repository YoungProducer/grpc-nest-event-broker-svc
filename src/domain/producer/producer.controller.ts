import { Controller } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { GrpcMethod } from '@nestjs/microservices';
import { EVENT_BROKER_SERVICE_NAME } from 'src/proto/event-broker.pb';
import { AddProducerRequestDto } from './dto/add-producer.request.dto';
import { AddProducerResponseDto } from './dto/add-producer.response.dto';
import { GetAllProducersResponseDto } from './dto/get-all-producers.response.dto';
import { ProduceEventRequestDto } from './dto/produce-event.request.dto';
import { ProduceEventResponseDto } from './dto/produce-event.response.dto';

@Controller()
export class ProducerController {
  constructor(private readonly producerService: ProducerService) {}

  @GrpcMethod(EVENT_BROKER_SERVICE_NAME, 'AddProducer')
  async addProducer(
    dto: AddProducerRequestDto,
  ): Promise<AddProducerResponseDto> {
    return await this.producerService.createProducer(dto);
  }

  @GrpcMethod(EVENT_BROKER_SERVICE_NAME, 'GetAllProducers')
  async getAllProducers(): Promise<GetAllProducersResponseDto> {
    return await this.producerService.getAllProducers();
  }

  @GrpcMethod(EVENT_BROKER_SERVICE_NAME, 'ProduceEvent')
  async produceEvent(
    dto: ProduceEventRequestDto,
  ): Promise<ProduceEventResponseDto> {
    return await this.producerService.produceEvent(dto);
  }
}
