import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueEntity, QueueService, TaskEntity } from '@tasks/library';

import { QueueController } from './queue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, QueueEntity])],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}
