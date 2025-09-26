import { Browser } from 'puppeteer-core';

import { ExeTypes, TaskModel } from '@tasks/lib';

import { findOnPageElements } from './find_on_page_elements.processor';
import { notifyWithMessageFromStore } from './notify_with_message_from_store.processor';
import { takeScreenshot } from './take_screenshot.processor';

export enum EResourceType {
  browser = 'browser',
}
export type taskProcessorType = {
  name: string;
  description: string;
  blocks?: EResourceType[];
  execute: (data: TaskModel, storage: { [key: string]: any }) => Promise<any>;
};
export type taskProcessorsType = {
  [key in keyof typeof ExeTypes]: taskProcessorType;
};

export class TaskProcessors {
  public browser: Browser | null = null; // Deprecated: use browsers Map instead
  public browsers: Map<string, Browser> = new Map();
  public blockedResources: EResourceType[] = [];
  private telegramApiService: any; // Будет инжектиться через DI
  private processors: taskProcessorsType = {} as taskProcessorsType;

  constructor(telegramApiService?: any) {
    this.telegramApiService = telegramApiService;
    this.initProcessors();
  }

  private initProcessors() {
    this.processors = {
      find_on_page_elements: findOnPageElements(),
      notify_with_message_from_store: notifyWithMessageFromStore(),
      take_screenshot: takeScreenshot(),
    };
  }

  public setTelegramApiService(telegramApiService: any) {
    this.telegramApiService = telegramApiService;
    this.initProcessors(); // Переинициализируем процессоры с новым сервисом
  }
  public addBlockedResource(resource: EResourceType) {
    if (!this.blockedResources.includes(resource)) {
      this.blockedResources.push(resource);
    }
  }
  public removeBlockedResource(resource: EResourceType) {
    this.blockedResources = this.blockedResources.filter((r) => r !== resource);
  }

  public getProcessor(
    type: keyof typeof ExeTypes
  ): taskProcessorType | undefined {
    return this.processors[type];
  }

  public setBrowser(browser: Browser) {
    this.browser = browser;
  }

  public setBrowsers(browsers: Map<string, Browser>) {
    this.browsers = browsers;
    // Set default browser for backward compatibility
    if (browsers.has('default')) {
      this.browser = browsers.get('default')!;
    }
  }

  public getBrowser(browserName?: string): Browser | null {
    if (!browserName || browserName === 'default') {
      return this.browser || this.browsers.get('default') || null;
    }
    return this.browsers.get(browserName) || null;
  }

  public getAvailableBrowsers(): string[] {
    return Array.from(this.browsers.keys());
  }

  public isResourceBlocked(resource: EResourceType): boolean {
    return this.blockedResources.includes(resource);
  }
}
export const taskProcessors = new TaskProcessors();
