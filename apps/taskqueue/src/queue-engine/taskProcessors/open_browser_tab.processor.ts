import { ExeTypes, ExeTypesPayloadMap, TaskModel } from '@tasks/lib';

import { EResourceType, taskProcessors, taskProcessorType } from './';

const payloadType = ExeTypesPayloadMap[ExeTypes.open_browser_tab];

export const openBrowserTab = (): taskProcessorType => {
  return {
    name: 'openBrowserTab',
    description: 'Opens a new browser tab',
    blocks: [EResourceType.browser],
    execute: async (data: TaskModel, storage) => {
      taskProcessors.addBlockedResource(EResourceType.browser);
      // Ensure the payload is parsed correctly
      const payload = JSON.parse(data.payload) as typeof payloadType;
      // Implement the logic to open a new browser tab
      console.log('Executing openBrowserTab with data:', payload);

      if (!payload.url) {
        throw new Error('URL is required to open a browser tab');
      }
      const browser = taskProcessors.browser;
      if (!browser) {
        throw new Error('Browser instance is not available');
      }
      const pages = await browser.pages();
      // Check if the URL is already open in any tab
      const existingTab = pages.find((page) =>
        page.url().includes(payload.url)
      );
      // check if we have already opened a browser tab with this url

      if (existingTab) {
        // Simulate opening a browser tab
        existingTab.bringToFront();
        console.log(
          `Tab with URL ${payload.url} is already open, bringing it to the front.`
        );
        taskProcessors.removeBlockedResource(EResourceType.browser);
        return {
          success: true,
          message: `Tab with URL ${payload.url} is already open, brought to the front.`,
          data: {
            page: existingTab,
            url: payload.url,
            // tabId: existingTab.target()._targetId, // Assuming you want to return the tab ID
          },
        };
      } else {
        // Open a new tab with the specified URL
        const newPage = await browser.newPage();
        await newPage.goto(payload.url);
        // sleep 5 seconds to ensure the page is loaded
        const wait = (ms: number) =>
          new Promise((resolve) => setTimeout(resolve, ms));
        await wait(5000); // Adjust the wait time as needed
        console.log(`Opened new tab with URL: ${payload.url}`);
        taskProcessors.removeBlockedResource(EResourceType.browser);
        return {
          success: true,
          message: `Opened new tab with URL: ${payload.url}`,
          data: {
            page: newPage,
            url: payload.url,
            // tabId: newPage.target()._targetId, // Assuming you want to return the tab ID
          },
        };
      }
    },
  };
};
