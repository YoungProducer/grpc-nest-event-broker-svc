import { Controller } from '@nestjs/common';
import { EventsService } from './events.service';
import { GrpcMethod } from '@nestjs/microservices';
import { EVENT_BROKER_SERVICE_NAME } from '../../proto/event-broker.pb';
import { ProduceEventResponseDto } from './dto/produce-event.response.dto';
import { ProduceEventRequestDto } from './dto/produce-event.request.dto';
import { ConsumeEventRequestDto } from './dto/consume-event.request.dto';
import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import { ConsumeEventResponseDto } from './dto/consume-event.response.dto';
import { Observable } from 'rxjs';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

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
    const { observer, unsubscribe } = await this.eventsService.getEventConsumer(
      dto,
    );

    call.addListener('cancelled', unsubscribe);

    return observer;
  }
}
