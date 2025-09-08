import { Test, TestingModule } from '@nestjs/testing';
import { PushoverController } from './pushover.controller';
import { PushoverService } from './pushover.service';
import { PushoverApiService } from './pushover-api.service';
import { PushoverWebhookDto } from './dto/pushover-webhook.dto';

describe('PushoverController', () => {
  let controller: PushoverController;
  let pushoverService: PushoverService;
  let pushoverApiService: PushoverApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushoverController],
      providers: [
        {
          provide: PushoverService,
          useValue: {
            handleWebhook: jest.fn().mockResolvedValue({ success: true, message: 'ok' }),
          },
        },
        {
          provide: PushoverApiService,
          useValue: {
            sendTaskNotification: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();
    controller = module.get<PushoverController>(PushoverController);
    pushoverService = module.get<PushoverService>(PushoverService);
    pushoverApiService = module.get<PushoverApiService>(PushoverApiService);
  });

  it('should handle webhook and return ok', async () => {
    const dto: PushoverWebhookDto = { user: 'u', action: 'a' };
    const result = await controller.handleWebhook(dto);
    expect(result).toEqual({ status: 'ok', message: 'ok' });
    expect(pushoverService.handleWebhook).toHaveBeenCalledWith(dto);
  });

  it('should handle webhook and return error', async () => {
    jest.spyOn(pushoverService, 'handleWebhook').mockResolvedValueOnce({ success: false, message: 'fail' });
    const dto: PushoverWebhookDto = { user: 'u', action: 'a' };
    const result = await controller.handleWebhook(dto);
    expect(result).toEqual({ status: 'error', message: 'fail' });
  });

  it('should send test notification', async () => {
    const result = await controller.testNotification();
    expect(result).toEqual({ message: 'Test notification sent with actions' });
    expect(pushoverApiService.sendTaskNotification).toHaveBeenCalledWith('Test Task');
  });
});
