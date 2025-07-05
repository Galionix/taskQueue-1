import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from '../task/entities/task.entity';
import { QueueEntity } from './entities/queue.entity';

@Module({
    imports: [
      TypeOrmModule.forFeature([
        TaskEntity,
        QueueEntity
      ]),
    ],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}
