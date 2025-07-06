import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TaskEntity } from '../task/task.entity';
import { QueueController } from './queue.controller';
import { QueueEntity } from './queue.entity';
import { QueueService } from './queue.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, QueueEntity])],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}
