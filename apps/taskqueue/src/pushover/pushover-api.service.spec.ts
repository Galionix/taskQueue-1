import axios from 'axios';
import { PushoverApiService } from './pushover-api.service';

describe('PushoverApiService', () => {
  let service: PushoverApiService;

  beforeEach(() => {
    service = new PushoverApiService();
    process.env.PUSHOVER_TOKEN = 'test-token';
    process.env.PUSHOVER_USER = 'test-user';
    process.env.TUNNEL_URL = 'https://tunnel.test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.PUSHOVER_TOKEN;
    delete process.env.PUSHOVER_USER;
    delete process.env.TUNNEL_URL;
  });

  it('should send message via axios.post with expected payload', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValue({ status: 200 });

    const actions = [
      { name: 'a1', text: 't1', url: 'https://a', url_title: 'u1' },
    ];

    await expect(service.sendMessage('hello', 'MyTitle', actions)).resolves.toBeUndefined();

    expect(postSpy).toHaveBeenCalledWith(
      'https://api.pushover.net/1/messages.json',
      expect.objectContaining({
        token: 'test-token',
        user: 'test-user',
        message: 'hello',
        title: 'MyTitle',
        actions: JSON.stringify(actions),
      })
    );
  });

  it('should rethrow error when axios.post fails', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('network-failure'));

    await expect(service.sendMessage('msg')).rejects.toThrow('network-failure');
  });

  it('should build actions and call sendMessage in sendTaskNotification', async () => {
    const sendSpy = jest.spyOn(service, 'sendMessage').mockResolvedValue(undefined);

    await service.sendTaskNotification('MyTask', 42);

    expect(sendSpy).toHaveBeenCalledTimes(1);

    const [messageArg, titleArg, actionsArg] = sendSpy.mock.calls[0] as [string, string, any[]];
    expect(actionsArg).toBeDefined();

    expect(messageArg).toContain('MyTask');
    expect(titleArg).toBe('Task Queue System');
    expect(Array.isArray(actionsArg)).toBe(true);
    expect(actionsArg.find((a: any) => a.name === 'start_queue_1')).toBeDefined();
    expect(actionsArg[0].url).toContain(process.env.TUNNEL_URL as string);
  });
});
