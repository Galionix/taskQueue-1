import { PushoverService } from './pushover.service';
import { PushoverApiService } from './pushover-api.service';

describe('PushoverService (auto)', () => {
  let service: PushoverService;
  const mockApi = {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    sendTaskNotification: jest.fn().mockResolvedValue(undefined),
  } as unknown as PushoverApiService;

  beforeEach(() => {
    service = new PushoverService(undefined as any, mockApi);
    jest.clearAllMocks();
  });

  it('handleWebhook returns unknown command for invalid action', async () => {
    const res = await service.handleWebhook({ action: 'unknown_action', user: 'u' } as any);
    expect(res.success).toBe(false);
    expect(res.message).toBe('Unknown command');
  });

  it('handleWebhook start_queue with no engine should succeed', async () => {
    const res = await service.handleWebhook({ action: 'start_queue_1', user: 'u' } as any);
    expect(res.success).toBe(true);
  });

  it('sendNotification delegates to api service', async () => {
    await service.sendNotification('msg', 't', []);
    expect(mockApi.sendMessage).toHaveBeenCalledWith('msg', 't', []);
  });

  it('sendTaskReadyNotification and sendStatusNotification call api', async () => {
    await service.sendTaskReadyNotification('TaskX');
    expect(mockApi.sendTaskNotification).toHaveBeenCalledWith('TaskX');

    await service.sendStatusNotification('OK');
    expect(mockApi.sendMessage).toHaveBeenCalled();
  });
});
