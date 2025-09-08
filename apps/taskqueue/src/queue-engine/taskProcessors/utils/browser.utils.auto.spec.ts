/* eslint-disable @typescript-eslint/no-var-requires */

import { openOrFocusTab } from './browser.utils';

describe('browser.utils', () => {
  it('returns existing tab when pages contain url', async () => {
    const existing = { url: () => 'http://x', bringToFront: jest.fn() };
    const browser = { pages: jest.fn().mockResolvedValue([existing]) } as any;
    const res = await openOrFocusTab(browser, 'http://x');
    expect(res).toBe(existing);
    expect(existing.bringToFront).toHaveBeenCalled();
  });

  it('opens new tab when not found', async () => {
    const newPage = { goto: jest.fn() };
    const browser = { pages: jest.fn().mockResolvedValue([]), newPage: jest.fn().mockResolvedValue(newPage) } as any;

    // speed up internal wait by temporarily overriding setTimeout to call immediately
    const originalSetTimeout = (global as any).setTimeout;
    (global as any).setTimeout = (fn: any, _ms?: number) => {
      fn();
      return 0 as any;
    };

    try {
      const res = await openOrFocusTab(browser, 'http://y');
      expect(res).toBe(newPage);
      expect(newPage.goto).toHaveBeenCalledWith('http://y');
    } finally {
      // restore original
      (global as any).setTimeout = originalSetTimeout;
    }
  });
});
