import { Browser } from 'puppeteer-core';

import { ExeTypes } from '@tasks/lib';

import { TaskEntity } from '../../task/task.entity';
import { findOnPageElements } from './find_on_page_elements.processor';
import { notifyWithMessageFromStore } from './notify_with_message_from_store.processor';
import { openBrowserTab } from './open_browser_tab.processor';

export enum EResourceType {
  browser = 'browser',
}
export type taskProcessorType = {
  name: string;
  description: string;
  blocks?: EResourceType[];
  execute: (data: TaskEntity, storage: { [key: string]: any }) => Promise<any>;
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
  public addBlockedResource(resource: EResourceType) {
    if (!this.blockedResources.includes(resource)) {
      this.blockedResources.push(resource);
    }
  }
  public removeBlockedResource(resource: EResourceType) {
    this.blockedResources = this.blockedResources.filter((r) => r !== resource);
  }
  private processors: taskProcessorsType = {
    find_on_page_elements: findOnPageElements(),
    open_browser_tab: openBrowserTab(),
    notify_with_message_from_store: notifyWithMessageFromStore(),
  };

  public getProcessor(
    type: keyof typeof ExeTypes
  ): taskProcessorType | undefined {
    return this.processors[type];
  }

  public setBrowser(browser: Browser) {
    this.browser = browser;
  }

  public isResourceBlocked(
    resource: EResourceType
  ): boolean {
    return this.blockedResources.includes(resource);
  }
}
export const taskProcessors = new TaskProcessors();
