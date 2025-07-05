import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './entities/task.entity';
import { QueueEntity } from '../queue/entities/queue.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskEntity,
      QueueEntity
      // AnswerEntity,
      // AnswerMessageEntity,
      // MessageEntity,
    ]),
  ],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
