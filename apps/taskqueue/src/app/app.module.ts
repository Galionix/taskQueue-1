import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PushoverModule } from '../pushover/pushover.module';
import { TelegramModule } from '../telegram/telegram.module';
import { QueueEngineModule } from '../queue-engine/queue-engine.module';
import { QueueEntity } from '../queue/queue.entity';
import { QueueModule } from '../queue/queue.module';
import { TaskEntity } from '../task/task.entity';
import { TaskModule } from '../task/task.module';
import { DocsModule } from '../docs/docs.module';
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
    QueueModule,
    QueueEngineModule,
    PushoverModule,
    TelegramModule,
    DocsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
