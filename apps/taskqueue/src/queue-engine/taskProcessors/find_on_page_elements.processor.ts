import { ExeTypes, ExeTypesPayloadMap, TaskModel, isEmptyResult } from '@tasks/lib';

import { EResourceType, taskProcessors, taskProcessorType } from './';
import { openOrFocusTab } from './utils/browser.utils';

const payloadType = ExeTypesPayloadMap[ExeTypes.find_on_page_elements];

export const findOnPageElements = (): taskProcessorType => {
  return {
    name: 'findOnPageElements',
    description: 'Finds elements on a page based on given criteria',
    blocks: [EResourceType.browser],
    execute: async (data: TaskModel, storage) => {
      taskProcessors.addBlockedResource(EResourceType.browser);

      const payload = JSON.parse(data.payload) as typeof payloadType;
      const browserName = payload.browserName || 'default';
      
      const browser = taskProcessors.getBrowser(browserName);
      if (!browser) {
        taskProcessors.removeBlockedResource(EResourceType.browser);
        throw new Error(`Browser instance '${browserName}' is not available. Available browsers: ${taskProcessors.getAvailableBrowsers().join(', ')}`);
      }
      const templateString = payload.templateString || '';
      // we assume currently we have an opened correct tab, but just in case we will check it
      const pages = await browser.pages();
      let currentPage = pages.find((page) => page.url() === payload.url);
      if (!currentPage) {
        // No tab with the URL found, open or focus the tab
        try {
          currentPage = await openOrFocusTab(browser, payload.url);
          if (!currentPage) {
            taskProcessors.removeBlockedResource(EResourceType.browser);
            throw new Error('Failed to open or find the page');
          }
        } catch (error) {
          taskProcessors.removeBlockedResource(EResourceType.browser);
          throw new Error(`Failed to open tab with URL ${payload.url}: ${error}`);
        }
      } else {
        // Tab already exists, check if we need to reload it
        if (payload.needReload) {
          await currentPage.reload();
          console.log(`Reloaded page: ${payload.url}`);
        } else {
          console.log(`Using current page state without reload: ${payload.url}`);
        }
      }
      await currentPage.bringToFront();
      // Find elements based on the provided selector
      const elements = await currentPage.$$(payload.queryToCount);
      let resultData: unknown = elements.length;
      let hasContent = false;
      
      if (elements.length === 0) {
        console.warn(`No elements found for selector: ${payload.queryToCount}`);
        resultData = 0;
      } else {
        if (payload.extractText) {
          // Extract text from each element if extractText is true
          const texts: string[] = await Promise.all(
            elements.map((el) => el.evaluate((node) => node.textContent))
          );
          
          // Filter out empty texts
          const nonEmptyTexts = texts.filter(text => text && text.trim() !== '');
          resultData = nonEmptyTexts;
          hasContent = nonEmptyTexts.length > 0;
          
          if (hasContent) {
            const formattedMessage = templateString
              .replace('{count}', elements.length.toString())
              .replace('{queryToCount}', payload.queryToCount)
              .replace('{url}', payload.url)
              .replace('{texts}', nonEmptyTexts.length > 1 ? nonEmptyTexts.join(', ').trim() : nonEmptyTexts[0]?.trim() || '');
            storage.message += `\n${formattedMessage}`;
          }
        } else {
          // Just count the elements
          resultData = elements.length;
          hasContent = elements.length > 0;
          
          if (hasContent) {
            const formattedMessage = templateString
              .replace('{count}', elements.length.toString())
              .replace('{queryToCount}', payload.queryToCount)
              .replace('{url}', payload.url);
            storage.message += `\n${formattedMessage}`;
          }
        }
        console.log(
          `Found ${elements.length} elements for selector: ${payload.queryToCount}`
        );
      }
      
      // Проверяем, является ли результат пустым
      const isEmpty = isEmptyResult(resultData);
      
      taskProcessors.removeBlockedResource(EResourceType.browser);
      return { 
        success: true, 
        elementsFound: elements.length > 0, 
        elements,
        data: resultData,
        isEmpty: isEmpty,
        hasContent: hasContent
      };
    },
  };
};
