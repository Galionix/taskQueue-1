import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TaskEntity } from '../task/task.entity';
import { TaskService } from '../task/task.service';
import { QueueController } from './queue.controller';
import { QueueEntity } from './queue.entity';
import { QueueService } from './queue.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, QueueEntity])],
  controllers: [QueueController],
  providers: [QueueService, TaskService],
  exports: [QueueService, TaskService],
  // Exporting TaskService to allow QueueService to use it
  // This is necessary for the QueueService to set queues to tasks
})
export class QueueModule {}
