import { Browser } from 'puppeteer-core';

import { ExeTypes, TaskModel } from '@tasks/lib';

import { findOnPageElements } from './find_on_page_elements.processor';
import { notifyWithMessageFromStore } from './notify_with_message_from_store.processor';
import { openBrowserTab } from './open_browser_tab.processor';
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
// export const taskProcessors: taskProcessorsType = {
//   find_on_page_elements: findOnPageElements(),
//   open_browser_tab: openBrowserTab(),
// };

export class TaskProcessors {
  public browser: Browser | null = null;
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
      open_browser_tab: openBrowserTab(),
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

  public isResourceBlocked(resource: EResourceType): boolean {
    return this.blockedResources.includes(resource);
  }
}
export const taskProcessors = new TaskProcessors();
