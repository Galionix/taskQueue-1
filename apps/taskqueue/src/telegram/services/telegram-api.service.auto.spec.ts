/* eslint-disable @typescript-eslint/no-var-requires */

jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  isAxiosError: (e: any) => !!(e && e.isAxiosError),
}));

jest.mock('form-data', () => {
  return class FakeForm {
    append = jest.fn();
    getHeaders() {
      return {};
    }
  };
});

jest.mock('fs', () => ({
  createReadStream: jest.fn(() => 'stream'),
}));

let axios = require('axios');

describe('TelegramApiService (auto)', () => {
  let TelegramApiService: any;
  let svc: any;

  beforeEach(() => {
    // Reset module registry but re-require mocked modules so references are fresh
    jest.resetModules();
    axios = require('axios');
    process.env.TELEGRAM_BOT_TOKEN = 'TEST_TOKEN';
    TelegramApiService = require('./telegram-api.service').TelegramApiService;
    svc = new TelegramApiService();
    axios.post.mockClear && axios.post.mockClear();
    axios.get && axios.get.mockClear && axios.get.mockClear();
    axios.post.mockResolvedValue({ data: {} });
  });

  it('should sendMessage with expected payload', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await svc.sendMessage('CHAT123', 'hello world');
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/sendMessage'),
      expect.objectContaining({ chat_id: 'CHAT123', text: 'hello world', parse_mode: 'HTML' })
    );
  });

  it('checkBotStatus returns true when API reports ok', async () => {
    axios.get.mockResolvedValue({ data: { ok: true, result: { username: 'botuser' } } });
    const res = await svc.checkBotStatus();
    expect(res).toBe(true);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/getMe'));
  });

  it('getUpdates returns empty array on axios error', async () => {
    axios.post.mockRejectedValue({ isAxiosError: true, response: { status: 401, data: {} }, message: 'auth' });
    const updates = await svc.getUpdates(42);
    expect(updates).toEqual([]);
  });

  it('sendPhoto and sendMediaGroup call axios.post and accept form-data', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await svc.sendPhoto('CHAT', '/tmp/photo.jpg', 'caption');
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/sendPhoto'), expect.anything(), expect.any(Object));

    await svc.sendMediaGroup('CHAT', ['/p1.jpg', '/p2.jpg'], 'multi');
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/sendMediaGroup'), expect.anything(), expect.any(Object));
  });

  it('handleApiError can be invoked for non-axios errors without throwing', () => {
    // call private method to increase branch coverage for non-axios branch
    (svc as any).handleApiError(new Error('boom'), 'context');
  });
});
