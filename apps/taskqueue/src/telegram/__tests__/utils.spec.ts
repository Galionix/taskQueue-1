import { KeyboardUtils } from '../utils/keyboard.utils';
import { MessageFormatter } from '../utils/message-formatter.utils';

// Test specifications for utility functions
export const UtilsTests = {
  description: 'Telegram Utils Tests',

  keyboardTests: {
    description: 'KeyboardUtils Tests',
    testCases: [
      {
        name: 'should create control keyboard with correct structure',
        test: () => {
          const keyboard = KeyboardUtils.createControlKeyboard();
          return (
            keyboard.inline_keyboard &&
            keyboard.inline_keyboard.length === 3 &&
            keyboard.inline_keyboard[0].length === 2 &&
            keyboard.inline_keyboard[1].length === 2 &&
            keyboard.inline_keyboard[2].length === 2
          );
        }
      },
      {
        name: 'should include restart engine button',
        test: () => {
          const keyboard = KeyboardUtils.createControlKeyboard();
          const restartButton = keyboard.inline_keyboard[1].find(
            btn => btn.callback_data === 'restart_engine'
          );
          return restartButton && restartButton.text === '🔄 Restart Engine';
        }
      },
      {
        name: 'should create main menu keyboard',
        test: () => {
          const keyboard = KeyboardUtils.createMainMenuKeyboard();
          return (
            keyboard.inline_keyboard &&
            keyboard.inline_keyboard.length === 2 &&
            keyboard.inline_keyboard[0].length === 2 &&
            keyboard.inline_keyboard[1].length === 2
          );
        }
      },
      {
        name: 'should create confirmation keyboard',
        test: () => {
          const keyboard = KeyboardUtils.createConfirmationKeyboard('test_action');
          const confirmButton = keyboard.inline_keyboard[0][0];
          const cancelButton = keyboard.inline_keyboard[0][1];
          return (
            confirmButton.callback_data === 'confirm_test_action' &&
            cancelButton.callback_data === 'cancel' &&
            confirmButton.text === '✅ Confirm' &&
            cancelButton.text === '❌ Cancel'
          );
        }
      }
    ]
  },

  messageFormatterTests: {
    description: 'MessageFormatter Tests',
    testCases: [
      {
        name: 'should format system status correctly',
        test: () => {
          const status = {
            queueEngineStatus: '🟢 Active',
            activeQueuesCount: 2,
            totalTasks: 5,
            browserStatus: '🌐 Connected',
            uptime: '1h 30m',
            memoryMB: 128
          };
          const formatted = MessageFormatter.formatSystemStatus(status);
          return (
            formatted.includes('🟢 Active') &&
            formatted.includes('Active Queues:</b> 2') &&
            formatted.includes('Total Tasks:</b> 5') &&
            formatted.includes('Memory:</b> 128 MB')
          );
        }
      },
      {
        name: 'should format welcome message',
        test: () => {
          const message = MessageFormatter.formatWelcomeMessage();
          return (
            message.includes('Добро пожаловать') &&
            message.includes('/menu') &&
            message.includes('/status') &&
            message.includes('/help')
          );
        }
      },
      {
        name: 'should format help message',
        test: () => {
          const message = MessageFormatter.formatHelpMessage();
          return (
            message.includes('Task Queue Bot') &&
            message.includes('Команды:') &&
            message.includes('Кнопки управления:') &&
            message.includes('Безопасность:')
          );
        }
      },
      {
        name: 'should format security info',
        test: () => {
          const message = MessageFormatter.formatSecurityInfo('testuser', '2h 15m');
          return (
            message.includes('testuser') &&
            message.includes('2h 15m') &&
            message.includes('Информация о безопасности') &&
            message.includes('TELEGRAM_ALLOWED_USERNAME')
          );
        }
      },
      {
        name: 'should format unauthorized message',
        test: () => {
          const message = MessageFormatter.formatUnauthorizedMessage('hacker', '999');
          return (
            message.includes('Доступ запрещён') &&
            message.includes('@hacker') &&
            message.includes('999') &&
            message.includes('авторизованных пользователей')
          );
        }
      },
      {
        name: 'should strip HTML tags',
        test: () => {
          const htmlText = '<b>Bold</b> and <i>italic</i> text';
          const stripped = MessageFormatter.stripHtml(htmlText);
          return stripped === 'Bold and italic text';
        }
      }
    ]
  }
};

// Simple test runners
export function runKeyboardUtilsTests() {
  console.log('⌨️ Running KeyboardUtils Tests...\n');

  UtilsTests.keyboardTests.testCases.forEach((testCase, index) => {
    try {
      const passed = testCase.test();
      console.log(`${index + 1}. ${testCase.name}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    } catch (error) {
      console.log(`${index + 1}. ${testCase.name}: ❌ ERROR - ${error}`);
    }
  });

  console.log('\n🏁 KeyboardUtils tests completed');
}

export function runMessageFormatterTests() {
  console.log('💬 Running MessageFormatter Tests...\n');

  UtilsTests.messageFormatterTests.testCases.forEach((testCase, index) => {
    try {
      const passed = testCase.test();
      console.log(`${index + 1}. ${testCase.name}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    } catch (error) {
      console.log(`${index + 1}. ${testCase.name}: ❌ ERROR - ${error}`);
    }
  });

  console.log('\n🏁 MessageFormatter tests completed');
}

export function runAllUtilsTests() {
  runKeyboardUtilsTests();
  console.log('\n');
  runMessageFormatterTests();
}
