// Mock the index module to avoid circular import during testing
jest.mock('./', () => ({
  EResourceType: { browser: 'browser' },
  taskProcessors: {
    addBlockedResource: jest.fn(),
    removeBlockedResource: jest.fn(),
    browser: null,
  },
}));

import { findOnPageElements } from './find_on_page_elements.processor';
import { openOrFocusTab } from './utils/browser.utils';

jest.mock('./utils/browser.utils', () => ({
  openOrFocusTab: jest.fn()
}));

describe('find_on_page_elements.processor (auto)', () => {
  it('should import processor module', () => {
    const mod = require('./find_on_page_elements.processor');
    expect(mod).toBeDefined();
  });
});
