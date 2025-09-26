import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowserEntity } from './browser.entity';
import { BrowserService } from './browser.service';
import { BrowserController } from './browser.controller';
import { BrowserSeeder } from './seeder/browser.seeder';
import { QueueEngineModule } from '../queue-engine/queue-engine.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrowserEntity]),
    forwardRef(() => QueueEngineModule)
  ],
  controllers: [BrowserController],
  providers: [BrowserService, BrowserSeeder],
  exports: [BrowserService],
})
export class BrowserModule {}
