import { Body, Controller, Post, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { PushoverService } from './pushover.service';
import { PushoverApiService } from './pushover-api.service';
import { PushoverWebhookDto } from './dto/pushover-webhook.dto';

@Controller('pushover')
export class PushoverController {
  private readonly logger = new Logger(PushoverController.name);

  constructor(
    private readonly pushoverService: PushoverService,
    private readonly pushoverApiService: PushoverApiService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() webhookData: PushoverWebhookDto) {
    this.logger.log('Received Pushover webhook');

    const result = await this.pushoverService.handleWebhook(webhookData);

    if (result.success) {
      return { status: 'ok', message: result.message };
    } else {
      return { status: 'error', message: result.message };
    }
  }

  @Post('test')
  async testNotification() {
    await this.pushoverApiService.sendTaskNotification('Test Task');

    return { message: 'Test notification sent with actions' };
  }
}
