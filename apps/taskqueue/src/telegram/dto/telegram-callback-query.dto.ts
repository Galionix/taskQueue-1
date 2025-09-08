import { TelegramUserDto } from './telegram-user.dto';
import { TelegramMessageDto } from './telegram-message.dto';

export class TelegramCallbackQueryDto {
  id!: string;
  from!: TelegramUserDto;
  message?: TelegramMessageDto;
  inline_message_id?: string;
  chat_instance!: string;
  data?: string;
  game_short_name?: string;
}
