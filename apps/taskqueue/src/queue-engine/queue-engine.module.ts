import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QueueEntity } from '../queue/queue.entity';
import { QueueService } from '../queue/queue.service';
import { TaskEntity } from '../task/task.entity';
import { TaskService } from '../task/task.service';
import { QueueEngineController } from './queue-engine.controller';
import { QueueEngineService } from './queue-engine.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, QueueEntity])],
  // No need to import TypeOrmModule here, as QueueEngineService does not use it
  controllers: [QueueEngineController],
  providers: [QueueEngineService, QueueService, TaskService],
})
export class QueueEngineModule {}
