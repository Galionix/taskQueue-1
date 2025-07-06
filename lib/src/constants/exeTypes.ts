export enum ExeTypes {
  'find_on_page_elements',
  'open_browser_tab',
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
};
