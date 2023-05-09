import { Module } from '@nestjs/common';
import { StreamsManagerService } from './streams-manager.service';

@Module({
  providers: [StreamsManagerService],
  exports: [StreamsManagerService],
})
export class StreamsManagerModule {}
