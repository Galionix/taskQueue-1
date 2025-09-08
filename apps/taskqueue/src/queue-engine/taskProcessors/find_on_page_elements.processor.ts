import { ExeTypes, ExeTypesPayloadMap, TaskModel } from '@tasks/lib';

import { EResourceType, taskProcessors, taskProcessorType } from './';

const payloadType = ExeTypesPayloadMap[ExeTypes.find_on_page_elements];

export const findOnPageElements = (): taskProcessorType => {
  return {
    name: 'findOnPageElements',
    description: 'Finds elements on a page based on given criteria',
    blocks: [EResourceType.browser],
    execute: async (data: TaskModel, storage) => {
      taskProcessors.addBlockedResource(EResourceType.browser);

      const browser = taskProcessors.browser;
      if (!browser) {
        taskProcessors.removeBlockedResource(EResourceType.browser);
        throw new Error('Browser instance is not available');
      }
      const payload = JSON.parse(data.payload) as typeof payloadType;
      // we assume currently we have an opened correct tab, but just in case we will check it
      const pages = await browser.pages();
      let currentPage = pages.find((page) => page.url() === payload.url);
      if (!currentPage) {
        // taskProcessors.removeBlockedResource(EResourceType.browser);
        // throw new Error(`No open tab found with URL: ${payload.url}`);
        const openTabProcessor =
          taskProcessors.getProcessor('open_browser_tab');
        if (!openTabProcessor) {
          taskProcessors.removeBlockedResource(EResourceType.browser);
          throw new Error('Open Browser Tab processor not found');
        }
        const openResult = await openTabProcessor.execute(data, storage);
        currentPage = openResult.data.page;
        if (!currentPage) {
          taskProcessors.removeBlockedResource(EResourceType.browser);
          throw new Error('Failed to open or find the page');
        }
        // refresh the page to ensure we have the latest content
      } else {
        await currentPage.reload();
      }
      await currentPage.bringToFront();
      // Find elements based on the provided selector
      const elements = await currentPage.$$(payload.queryToCount);
      if (elements.length === 0) {
        console.warn(`No elements found for selector: ${payload.queryToCount}`);
      } else {
        if (payload.extractText) {
          // Extract text from each element if extractText is true
          const texts: string[] = await Promise.all(
            elements.map((el) => el.evaluate((node) => node.textContent))
          );
          const allEmpty = texts.every((text) => !text || text.trim() === '');
          if (allEmpty) {
            return {
              success: true,
              elementsFound: false,
              elements: [],
            };
          }
          storage.message += `\n${payload.url} has text for selector: ${
            payload.queryToCount
          }: ${texts.join(', ').trim()}`;
        } else {
          // Just count the elements
          storage.message += `\nFound ${elements.length} elements for selector: ${payload.queryToCount} on page ${payload.url}`;
        }
        console.log(
          `Found ${elements.length} elements for selector: ${payload.queryToCount}`
        );
      }
      taskProcessors.removeBlockedResource(EResourceType.browser);
      return { success: true, elementsFound: elements.length > 0, elements };
    },
  };
};
