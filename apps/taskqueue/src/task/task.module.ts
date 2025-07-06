import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueEntity, TaskEntity, TaskService } from '@tasks/library';

import { TaskController } from './task.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskEntity,
      QueueEntity,
      // AnswerEntity,
      // AnswerMessageEntity,
      // MessageEntity,
    ]),
  ],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
