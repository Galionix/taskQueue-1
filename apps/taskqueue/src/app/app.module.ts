import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueEntity, TaskEntity } from '@tasks/library';

import { QueueModule } from '../queue/queue.module';
import { TaskModule } from '../task/task.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'taskDB.db',
      entities: [TaskEntity, QueueEntity],
      synchronize: true,
      autoLoadEntities: true,
    }),
    TaskModule,
    QueueModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
