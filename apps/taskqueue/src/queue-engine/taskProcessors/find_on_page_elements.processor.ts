import { ExeTypes, ExeTypesPayloadMap } from '@tasks/lib';

import { TaskEntity } from '../../task/task.entity';
import { EResourceType, taskProcessors, taskProcessorType } from './';

const payloadType = ExeTypesPayloadMap[ExeTypes.find_on_page_elements];

export const findOnPageElements = ():taskProcessorType => {
  return {
    name: 'findOnPageElements',
    description: 'Finds elements on a page based on given criteria',
    blocks: [EResourceType.browser],
    execute: async (data: TaskEntity, storage) => {
      taskProcessors.addBlockedResource(EResourceType.browser);

      const browser = taskProcessors.browser
      if (!browser) {
        taskProcessors.removeBlockedResource(EResourceType.browser);
        throw new Error('Browser instance is not available');
      }
      const payload = JSON.parse(data.payload) as typeof payloadType;
      // we assume currently we have an opened correct tab, but just in case we will check it
      const pages = await browser.pages();
      const currentPage = pages.find((page) => page.url() === payload.url);
      if (!currentPage) {
        taskProcessors.removeBlockedResource(EResourceType.browser);
        throw new Error(`No open tab found with URL: ${payload.url}`);
      }
      await currentPage.bringToFront();
      // Find elements based on the provided selector
      const elements = await currentPage.$$(payload.queryToCount)
      if (elements.length === 0) {
        console.warn(`No elements found for selector: ${payload.queryToCount}`)
      } else {
        storage.message += `\nFound ${elements.length} elements for selector: ${payload.queryToCount} on page ${payload.url}`;
        console.log(`Found ${elements.length} elements for selector: ${payload.queryToCount}`)
      }
      taskProcessors.removeBlockedResource(EResourceType.browser);
      return { success: true, elementsFound: elements.length > 0, elements };
    },
  };
}