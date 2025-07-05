import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskModule } from '../task/task.module';
import { TaskEntity } from '../task/entities/task.entity';
import { QueueModule } from '../queue/queue.module';
import { QueueEntity } from '../queue/entities/queue.entity';

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
