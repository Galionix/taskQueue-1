import { TelegramUserDto } from './telegram-user.dto';
import { TelegramChatDto } from './telegram-chat.dto';

export class TelegramMessageDto {
  message_id!: number;
  from!: TelegramUserDto;
  chat!: TelegramChatDto;
  date!: number;
  text?: string;
  entities?: any[];
  reply_to_message?: TelegramMessageDto;
}
