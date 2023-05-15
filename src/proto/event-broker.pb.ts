/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from "@nestjs/microservices";
import { Observable } from "rxjs";

export const protobufPackage = "event_broker";

export interface EmptyMessage {
}

export interface AddProducerRequest {
  name: string;
  events: string[];
}

export interface AddProducerResponse {
  producerId: string;
  status: number;
  error: string;
}

export interface AddConsumerRequest {
  /** string producerName = 1; */
  name: string;
  events: string[];
}

export interface AddConsumerResponse {
  consumerId: string;
  status: number;
  error: string;
}

export interface RemoveProducerRequest {
  producerId: string;
}

export interface RemoveProducerResponse {
  status: number;
  error: string;
}

export interface RemoveConsumerRequest {
  consumerId: string;
}

export interface RemoveConsumerResponse {
  status: number;
  error: string;
}

export interface GetAllProducersResponse {
  status: number;
  error: string;
  producers: GetAllProducersResponse_Producer[];
}

export interface GetAllProducersResponse_Producer {
  id: string;
  name: string;
  events: string[];
}

export interface GetAllConsumersResponse {
  status: number;
  error: string;
  consumers: GetAllConsumersResponse_Consumer[];
}

export interface GetAllConsumersResponse_Consumer {
  id: string;
  name: string;
  events: string[];
}

export interface ProduceEventRequest {
  producerName: string;
  event: string;
  data: string;
}

export interface ProduceEventResponse {
  status: number;
  error: string;
}

export interface ConsumeEventRequest {
  producerName: string;
  consumerName: string;
  event: string;
}

export interface ConsumeEventResponse {
  status: number;
  error: string;
  data: string;
}

export const EVENT_BROKER_PACKAGE_NAME = "event_broker";

export interface EventBrokerServiceClient {
  addProducer(request: AddProducerRequest): Observable<AddProducerResponse>;

  addConsumer(request: AddConsumerRequest): Observable<AddConsumerResponse>;

  removeProducer(request: RemoveProducerRequest): Observable<RemoveProducerResponse>;

  removeConsumer(request: RemoveConsumerRequest): Observable<RemoveConsumerResponse>;

  getAllProducers(request: EmptyMessage): Observable<GetAllProducersResponse>;

  getAllConsumers(request: EmptyMessage): Observable<GetAllConsumersResponse>;

  produceEvent(request: ProduceEventRequest): Observable<ProduceEventResponse>;

  consumeEvent(request: ConsumeEventRequest): Observable<ConsumeEventResponse>;
}

export interface EventBrokerServiceController {
  addProducer(
    request: AddProducerRequest,
  ): Promise<AddProducerResponse> | Observable<AddProducerResponse> | AddProducerResponse;

  addConsumer(
    request: AddConsumerRequest,
  ): Promise<AddConsumerResponse> | Observable<AddConsumerResponse> | AddConsumerResponse;

  removeProducer(
    request: RemoveProducerRequest,
  ): Promise<RemoveProducerResponse> | Observable<RemoveProducerResponse> | RemoveProducerResponse;

  removeConsumer(
    request: RemoveConsumerRequest,
  ): Promise<RemoveConsumerResponse> | Observable<RemoveConsumerResponse> | RemoveConsumerResponse;

  getAllProducers(
    request: EmptyMessage,
  ): Promise<GetAllProducersResponse> | Observable<GetAllProducersResponse> | GetAllProducersResponse;

  getAllConsumers(
    request: EmptyMessage,
  ): Promise<GetAllConsumersResponse> | Observable<GetAllConsumersResponse> | GetAllConsumersResponse;

  produceEvent(
    request: ProduceEventRequest,
  ): Promise<ProduceEventResponse> | Observable<ProduceEventResponse> | ProduceEventResponse;

  consumeEvent(request: ConsumeEventRequest): Observable<ConsumeEventResponse>;
}

export function EventBrokerServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = [
      "addProducer",
      "addConsumer",
      "removeProducer",
      "removeConsumer",
      "getAllProducers",
      "getAllConsumers",
      "produceEvent",
      "consumeEvent",
    ];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod("EventBrokerService", method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod("EventBrokerService", method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const EVENT_BROKER_SERVICE_NAME = "EventBrokerService";
