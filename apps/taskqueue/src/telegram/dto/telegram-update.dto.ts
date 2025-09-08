import { TelegramMessageDto } from './telegram-message.dto';
import { TelegramCallbackQueryDto } from './telegram-callback-query.dto';

export class TelegramUpdateDto {
  update_id!: number;
  message?: TelegramMessageDto;
  edited_message?: TelegramMessageDto;
  channel_post?: TelegramMessageDto;
  edited_channel_post?: TelegramMessageDto;
  callback_query?: TelegramCallbackQueryDto;
  inline_query?: any;
  chosen_inline_result?: any;
  shipping_query?: any;
  pre_checkout_query?: any;
  poll?: any;
  poll_answer?: any;
}
