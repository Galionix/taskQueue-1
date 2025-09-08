export enum ExeTypes {
  'find_on_page_elements',
  'open_browser_tab',
  'notify_with_message_from_store',
  'take_screenshot',
}

// this should be manually copied to apps\frontend\src\api\types.ts
export const ExeTypesPayloadMap = {
  [ExeTypes.find_on_page_elements]: {
    url: 'google.com',
    queryToCount: '#ai-helper-widget',
    extractText: true, // if true, will extract text from the element
  },
  [ExeTypes.open_browser_tab]: {
    url: 'google.com',
  },
  [ExeTypes.notify_with_message_from_store]: {
    device: 'pocof6pro',
    title: 'We found something',
    sound: 'good_news',
    priority: 1,
    sendIfEmpty: false, // if true, will send notification even if storage.message is empty
    message: 'No message found in storage',
  },
  [ExeTypes.take_screenshot]: {
    outputPath: 'C:\\screenshots\\',
    filename: 'screenshot_{timestamp}.png',
    sendNotification: true, // if true, will add screenshot info to storage.message
  },
};
