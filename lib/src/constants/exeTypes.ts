export enum ExeTypes {
  'find_on_page_elements',
  'open_browser_tab',
  'notify_with_message_from_store',
}

// this should be manually copied to apps\frontend\src\api\types.ts
export const ExeTypesPayloadMap = {
  [ExeTypes.find_on_page_elements]: {
    url: 'google.com',
    queryToCount: '#ai-helper-widget',
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
};
