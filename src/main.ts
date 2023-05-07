import { NestFactory } from '@nestjs/core';
import { INestMicroservice, ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { protobufPackage } from './proto/event-broker.pb';
import { ExceptionFilter } from './lib/filters/rpc-exception.filter';

async function bootstrap() {
  const app: INestMicroservice = await NestFactory.createMicroservice(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        url: 'localhost:50052',
        package: protobufPackage,
        protoPath: join(
          'node_modules/grpc-nest-proto/proto/event-broker.proto',
        ),
      },
      bufferLogs: true,
    },
  );

  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new ExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.listen();
}

bootstrap();
