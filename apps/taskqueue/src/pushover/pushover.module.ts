import { Module } from '@nestjs/common';
import { PushoverApiService } from './pushover-api.service';

@Module({
  providers: [PushoverApiService],
  exports: [PushoverApiService],
})
export class PushoverModule {}
