import { Module } from '@nestjs/common';
import { QueueEngineModule } from '../queue-engine/queue-engine.module';
import { QueueModule } from '../queue/queue.module';
import { TaskModule } from '../task/task.module';

// Services
import { TelegramApiService, TelegramService, StatusService } from './services';

// Controllers
import { TelegramController } from './controllers';

// Handlers
import { CommandHandler, AuthHandler } from './handlers';

@Module({
  imports: [QueueEngineModule, QueueModule, TaskModule],
  controllers: [TelegramController],
  providers: [
    // Services
    TelegramApiService,
    TelegramService,
    StatusService,
    // Handlers
    CommandHandler,
    AuthHandler,
  ],
  exports: [
    TelegramService,
    TelegramApiService,
  ],
})
export class TelegramModule {}
