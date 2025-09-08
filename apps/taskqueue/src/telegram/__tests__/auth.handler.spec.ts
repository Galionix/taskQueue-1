import { AuthHandler } from '../handlers/auth.handler';
import { TelegramUpdateDto, TelegramUserDto } from '../dto';

// Test case type definitions
type TestSetupResult =
  | { handler: AuthHandler; user: TelegramUserDto }
  | { handler: AuthHandler; update: TelegramUpdateDto };

type TestCase = {
  name: string;
  setup: () => TestSetupResult;
  test: (result: TestSetupResult) => boolean;
};

// Test specifications for AuthHandler
export const AuthHandlerTests: {
  description: string;
  testCases: TestCase[];
} = {
  description: 'AuthHandler Tests',
  testCases: [
    {
      name: 'should authorize user with correct username',
      setup: () => {
        process.env.TELEGRAM_ALLOWED_USERNAME = 'testuser';
        const handler = new AuthHandler();
        const user: TelegramUserDto = {
          id: 123,
          is_bot: false,
          first_name: 'Test',
          username: 'testuser'
        };
        return { handler, user };
      },
      test: (result) => {
        const { handler, user } = result as { handler: AuthHandler; user: TelegramUserDto };
        const isAuthorized = handler.isUserAuthorized(user);
        return isAuthorized === true;
      }
    },
    {
      name: 'should reject unauthorized user',
      setup: () => {
        process.env.TELEGRAM_ALLOWED_USERNAME = 'testuser';
        const handler = new AuthHandler();
        const user: TelegramUserDto = {
          id: 123,
          is_bot: false,
          first_name: 'Test',
          username: 'wronguser'
        };
        return { handler, user };
      },
      test: (result) => {
        const { handler, user } = result as { handler: AuthHandler; user: TelegramUserDto };
        const isAuthorized = handler.isUserAuthorized(user);
        return isAuthorized === false;
      }
    },
    {
      name: 'should allow all users when no username restriction is set',
      setup: () => {
        delete process.env.TELEGRAM_ALLOWED_USERNAME;
        const handler = new AuthHandler();
        const user: TelegramUserDto = {
          id: 123,
          is_bot: false,
          first_name: 'Test',
          username: 'anyuser'
        };
        return { handler, user };
      },
      test: (result) => {
        const { handler, user } = result as { handler: AuthHandler; user: TelegramUserDto };
        const isAuthorized = handler.isUserAuthorized(user);
        return isAuthorized === true;
      }
    },
    {
      name: 'should extract user from message update',
      setup: () => {
        const handler = new AuthHandler();
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
        return { handler, update };
      },
      test: (result) => {
        const { handler, update } = result as { handler: AuthHandler; update: TelegramUpdateDto };
        const user = handler.getUserFromUpdate(update);
        return user?.id === 123 && user?.username === 'testuser';
      }
    },
    {
      name: 'should extract user from callback query update',
      setup: () => {
        const handler = new AuthHandler();
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
        return { handler, update };
      },
      test: (result) => {
        const { handler, update } = result as { handler: AuthHandler; update: TelegramUpdateDto };
        const user = handler.getUserFromUpdate(update);
        return user?.id === 123 && user?.username === 'testuser';
      }
    }
  ]
};

// Simple test runner for manual testing
export function runAuthHandlerTests() {
  console.log('🧪 Running AuthHandler Tests...\n');

  AuthHandlerTests.testCases.forEach((testCase, index) => {
    try {
      const setupResult = testCase.setup();
      const passed = testCase.test(setupResult);

      console.log(`${index + 1}. ${testCase.name}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    } catch (error) {
      console.log(`${index + 1}. ${testCase.name}: ❌ ERROR - ${error}`);
    }
  });

  console.log('\n🏁 AuthHandler tests completed');
}
