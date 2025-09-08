/* eslint-disable @typescript-eslint/no-var-requires */

import { sendScreenshotsToTelegram } from './send_screenshots_to_telegram.processor';

describe('sendScreenshotsToTelegram processor', () => {
  const fakeData = { name: 'Test', id: 1 } as any;
  const fakeStorage = { screenshotFiles: ['a.png'], message: 'msg' } as any;

  it('returns no screenshots when none in storage', async () => {
    const processor = sendScreenshotsToTelegram();
    const res = await processor.execute(fakeData, { screenshotFiles: [] } as any);
    expect(res.success).toBe(true);
    expect(res.message).toContain('No screenshots');
  });

  it('fails when TELEGRAM_CHAT_ID not set', async () => {
    const processor = sendScreenshotsToTelegram();
    const res = await processor.execute(fakeData, fakeStorage);
    expect(res.success).toBe(false);
    // assert that failure is due to missing chat id or api service
    expect(res.message).toMatch(/TELEGRAM_CHAT_ID not configured|TelegramApiService not available/);
  });

  it('fails when no api service provided', async () => {
    process.env.TELEGRAM_CHAT_ID = '123';
    const processor = sendScreenshotsToTelegram();
    const res = await processor.execute(fakeData, fakeStorage);
    expect(res.success).toBe(false);
    expect(res.message).toContain('TelegramApiService not available');
    delete process.env.TELEGRAM_CHAT_ID;
  });

  it('sends single file via sendPhoto', async () => {
    process.env.TELEGRAM_CHAT_ID = 'c';
    const mockApi = { sendPhoto: jest.fn().mockResolvedValue(undefined), sendMediaGroup: jest.fn().mockResolvedValue(undefined) } as any;
    const processor = sendScreenshotsToTelegram(mockApi);
    const storage = { screenshotFiles: ['one.png'], message: 'hello' } as any;

    const res = await processor.execute(fakeData, storage);
    expect(res.success).toBe(true);
    expect(mockApi.sendPhoto).toHaveBeenCalledWith('c', 'one.png', expect.any(String));

    delete process.env.TELEGRAM_CHAT_ID;
  });

  it('sends multiple files via sendMediaGroup', async () => {
    process.env.TELEGRAM_CHAT_ID = 'c';
    const mockApi = { sendPhoto: jest.fn().mockResolvedValue(undefined), sendMediaGroup: jest.fn().mockResolvedValue(undefined) } as any;
    const processor = sendScreenshotsToTelegram(mockApi);
    const storage = { screenshotFiles: ['one.png', 'two.png'], message: 'hello' } as any;

    const res = await processor.execute(fakeData, storage);
    expect(res.success).toBe(true);
    expect(mockApi.sendMediaGroup).toHaveBeenCalledWith('c', ['one.png', 'two.png'], expect.any(String));

    delete process.env.TELEGRAM_CHAT_ID;
  });
});
