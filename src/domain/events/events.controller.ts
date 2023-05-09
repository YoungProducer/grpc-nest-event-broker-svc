import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';

import { EventsService } from './events.service';
import { EVENT_BROKER_SERVICE_NAME } from '../../proto/event-broker.pb';
import { ProduceEventResponseDto } from './dto/produce-event.response.dto';
import { ProduceEventRequestDto } from './dto/produce-event.request.dto';
import { ConsumeEventRequestDto } from './dto/consume-event.request.dto';
import { ConsumeEventResponseDto } from './dto/consume-event.response.dto';
import { ConsumerService } from '../consumer/consumer.service';

@Controller()
export class EventsController {
  constructor(
    private readonly consumerService: ConsumerService,
    private readonly eventsService: EventsService,
  ) {}

  @GrpcMethod(EVENT_BROKER_SERVICE_NAME, 'ProduceEvent')
  async produceEvent(
    dto: ProduceEventRequestDto,
  ): Promise<ProduceEventResponseDto> {
    return await this.eventsService.produceEvent(dto);
  }

  @GrpcMethod(EVENT_BROKER_SERVICE_NAME, 'ConsumeEvent')
  async consumeEvent(
    dto: ConsumeEventRequestDto,
    _metadata: Metadata,
    call: ServerUnaryCall<ConsumeEventRequestDto, ConsumeEventResponseDto>,
  ): Promise<Observable<ConsumeEventResponseDto>> {
    await this.consumerService.canConsumeEvent(dto);

    const { observable, unsubscribe } =
      this.eventsService.getStreamObserver(dto);

    call.addListener('cancelled', unsubscribe);

    return observable;
  }
}
