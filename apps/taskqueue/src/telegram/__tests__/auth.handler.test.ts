import { AuthHandler } from '../handlers/auth.handler';
import { TelegramUpdateDto, TelegramUserDto } from '../dto';

describe('AuthHandler', () => {
  let authHandler: AuthHandler;

  beforeEach(() => {
    authHandler = new AuthHandler();
    // Clean up environment
    delete process.env.TELEGRAM_ALLOWED_USERNAME;
  });

  describe('isUserAuthorized', () => {
    it('should authorize user with correct username', () => {
      process.env.TELEGRAM_ALLOWED_USERNAME = 'testuser';
      
      const user: TelegramUserDto = {
        id: 123,
        is_bot: false,
        first_name: 'Test',
        username: 'testuser'
      };

      expect(authHandler.isUserAuthorized(user)).toBe(true);
    });

    it('should reject unauthorized user', () => {
      process.env.TELEGRAM_ALLOWED_USERNAME = 'testuser';
      
      const user: TelegramUserDto = {
        id: 123,
        is_bot: false,
        first_name: 'Test',
        username: 'wronguser'
      };

      expect(authHandler.isUserAuthorized(user)).toBe(false);
    });

    it('should allow all users when no username restriction is set', () => {
      const user: TelegramUserDto = {
        id: 123,
        is_bot: false,
        first_name: 'Test',
        username: 'anyuser'
      };

      expect(authHandler.isUserAuthorized(user)).toBe(true);
    });
  });

  describe('getUserFromUpdate', () => {
    it('should extract user from message update', () => {
      const update: TelegramUpdateDto = {
        update_id: 1,
        message: {
          message_id: 1,
          from: {
            id: 123,
            is_bot: false,
            first_name: 'Test',
            username: 'testuser'
          },
          chat: {
            id: 123,
            type: 'private'
          },
          date: Date.now(),
          text: 'test'
        }
      };

      const user = authHandler.getUserFromUpdate(update);
      
      expect(user).toBeDefined();
      expect(user?.id).toBe(123);
      expect(user?.username).toBe('testuser');
    });

    it('should extract user from callback query update', () => {
      const update: TelegramUpdateDto = {
        update_id: 1,
        callback_query: {
          id: 'callback-1',
          from: {
            id: 123,
            is_bot: false,
            first_name: 'Test',
            username: 'testuser'
          },
          chat_instance: 'instance-1',
          data: 'test_data'
        }
      };

      const user = authHandler.getUserFromUpdate(update);
      
      expect(user).toBeDefined();
      expect(user?.id).toBe(123);
      expect(user?.username).toBe('testuser');
    });

    it('should return null for update without user', () => {
      const update: TelegramUpdateDto = {
        update_id: 1
      };

      const user = authHandler.getUserFromUpdate(update);
      
      expect(user).toBeNull();
    });
  });
});
