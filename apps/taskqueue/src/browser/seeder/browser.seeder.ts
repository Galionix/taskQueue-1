import { Injectable, OnModuleInit } from '@nestjs/common';
import { BrowserService } from '../browser.service';

@Injectable()
export class BrowserSeeder implements OnModuleInit {
  constructor(private readonly browserService: BrowserService) {}

  async onModuleInit() {
    // Создаем тестовый браузер galaktionovdmytro, если его еще нет
    const existingBrowser = await this.browserService.findByName('galaktionovdmytro');
    
    if (!existingBrowser) {
      console.log('🌱 Creating seed browser: galaktionovdmytro');
      await this.browserService.create({
        name: 'galaktionovdmytro',
        description: 'Galaktionov Dmytro Google Account',
        isActive: true
      });
      console.log('✅ Seed browser created successfully');
    }
  }
}
