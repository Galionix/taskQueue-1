export class TelegramUserDto {
  id!: number;
  is_bot!: boolean;
  first_name!: string;
  username?: string;
  last_name?: string;
  language_code?: string;
}
