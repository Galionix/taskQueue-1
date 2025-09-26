export enum ExeTypes {
  'find_on_page_elements',
  'notify_with_message_from_store',
  'take_screenshot',
}

// this should be manually copied to apps\frontend\src\api\types.ts
export const ExeTypesPayloadMap = {
  [ExeTypes.find_on_page_elements]: {
    url: 'google.com',
    queryToCount: '#ai-helper-widget',
    extractText: true, // if true, will extract text from the element
    templateString: 'Found {count} elements for selector {queryToCount} on {url}.', // {count}, {queryToCount}, {url}
    browserName: 'default', // Available browsers: default, galaktionovdmytro
    needReload: false, // if true, will reload the page before searching; if false, will search on current page state
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

export const ExeTypesDescriptionMap = {
  [ExeTypes.find_on_page_elements]: {
    name: 'Find On Page Elements',
    usage: `
url: string - The URL of the page to search. This is used to search for in already opened tabs first. So the needed tab, if its already opened - should include this url. Otherwise, opens new.
queryToCount: string - The CSS selector to find elements on the page. Counts the number of elements matching this selector is default behavior.
extractText: boolean - If true, extracts text content from the found elements. If false, just counts the number of elements found.
templateString: string - A template string to format the output message. Supports placeholders: {count}, {queryToCount}, {url}, if extractText is true - {texts} (comma separated texts from found elements).
browserName: string - The name of the browser to use for this task. Available browsers are shown dynamically based on your configuration.
needReload: boolean - If true, will reload the page before searching for elements. If false, will search on the current page state without reloading.
    `
  },
  [ExeTypes.notify_with_message_from_store]: {
    name: 'Notify With Message From Storage',
    usage: `
device: string - The device name to send the notification to. This should match the device name registered in Pushover.
title: string - The title of the notification.
sound: string - The sound to play when the notification is received. Should be one of the sounds supported by Pushover.
priority: number - The priority of the notification. Ranges from -2 (lowest) to 2 (highest).
sendIfEmpty: boolean - If true, sends the notification even if storage.message is empty. If false, only sends if there is a message.
message: string - The default message to send if storage.message is empty and sendIfEmpty is true.
    `
  },
  [ExeTypes.take_screenshot]: {
    name: 'Take Screenshot',
    usage: `
outputPath: string - The directory where the screenshot will be saved.
filename: string - The filename for the screenshot. Can include {timestamp} placeholder.
sendNotification: boolean - If true, sends a notification with the screenshot.
    `
  },
};