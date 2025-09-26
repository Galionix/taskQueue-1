import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PushoverModule } from '../pushover/pushover.module';
import { TelegramModule } from '../telegram/telegram.module';
import { QueueEngineModule } from '../queue-engine/queue-engine.module';
import { QueueEntity } from '../queue/queue.entity';
import { QueueModule } from '../queue/queue.module';
import { TaskEntity } from '../task/task.entity';
import { TaskModule } from '../task/task.module';
import { BrowserEntity } from '../browser/browser.entity';
import { BrowserModule } from '../browser/browser.module';
import { DocsModule } from '../docs/docs.module';
import { ScreenshotCleanupService } from '../services/screenshot-cleanup.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'taskDB.db',
      entities: [TaskEntity, QueueEntity, BrowserEntity],
      synchronize: true,
      autoLoadEntities: true,
    }),
    TaskModule,
    QueueModule,
    QueueEngineModule,
    BrowserModule,
    PushoverModule,
    TelegramModule,
    DocsModule,
  ],
  controllers: [AppController],
  providers: [AppService, ScreenshotCleanupService],
})
export class AppModule {}
