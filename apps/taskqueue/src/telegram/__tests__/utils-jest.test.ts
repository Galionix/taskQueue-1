import { KeyboardUtils } from '../utils/keyboard.utils';
import { MessageFormatter } from '../utils/message-formatter.utils';

describe('KeyboardUtils', () => {
  describe('createControlKeyboard', () => {
    it('should create control keyboard with correct structure', () => {
      const keyboard = KeyboardUtils.createControlKeyboard();
      expect(keyboard.inline_keyboard).toBeDefined();
      expect(keyboard.inline_keyboard.length).toBe(3);
      const allButtons = keyboard.inline_keyboard.flat();
      const buttonTexts = allButtons.map(btn => btn.text);
      expect(buttonTexts).toContain('\u25b6\ufe0f Start Queue 1');
      expect(buttonTexts).toContain('\u23f9\ufe0f Stop Queue 1');
      expect(buttonTexts).toContain('\ud83d\udcca Status');
      expect(buttonTexts).toContain('\ud83d\udd04 Restart Engine');
      expect(buttonTexts).toContain('\ud83c\udf10 Open Google');
      expect(buttonTexts).toContain('\ud83d\udd0d Count Elements');
    });
    it('should have callback_data for all buttons', () => {
      const keyboard = KeyboardUtils.createControlKeyboard();
      const allButtons = keyboard.inline_keyboard.flat();
      allButtons.forEach(button => {
        expect(button.callback_data).toBeDefined();
        expect(typeof button.callback_data).toBe('string');
      });
    });
  });
});

describe('MessageFormatter', () => {
  describe('formatSystemStatus', () => {
    it('should format system status correctly', () => {
      const mockStatus = {
        queueEngineStatus: 'running',
        activeQueuesCount: 2,
        totalTasks: 5,
        browserStatus: 'active',
        uptime: '1h 1m 1s',
        memoryMB: 150.5,
      };
      const formatted = MessageFormatter.formatSystemStatus(mockStatus);
      expect(formatted).toContain('<b>Queue Engine</b>');
      expect(formatted).toContain('Active Queues:</b> 2');
      expect(formatted).toContain('Total Tasks:</b> 5');
      expect(formatted).toContain('Memory:</b> 150.5 MB');
      expect(formatted).toContain('Uptime:</b> 1h 1m 1s');
      expect(formatted).toContain('Browser:</b> active');
    });
    it('should handle zero values correctly', () => {
      const mockStatus = {
        queueEngineStatus: 'stopped',
        activeQueuesCount: 0,
        totalTasks: 0,
        browserStatus: 'inactive',
        uptime: '0s',
        memoryMB: 0,
      };
      const formatted = MessageFormatter.formatSystemStatus(mockStatus);
      expect(formatted).toContain('Active Queues:</b> 0');
      expect(formatted).toContain('Total Tasks:</b> 0');
      expect(formatted).toContain('Memory:</b> 0 MB');
      expect(formatted).toContain('Uptime:</b> 0s');
      expect(formatted).toContain('Browser:</b> inactive');
    });
  });
  describe('formatWelcomeMessage', () => {
    it('should return welcome message', () => {
      const welcome = MessageFormatter.formatWelcomeMessage();
      expect(welcome).toContain('<b>Добро пожаловать!</b>');
      expect(welcome).toContain('/menu');
      expect(welcome).toContain('/status');
      expect(welcome).toContain('/help');
    });
  });
  describe('formatHelpMessage', () => {
    it('should return help message', () => {
      const help = MessageFormatter.formatHelpMessage();
      expect(help).toContain('<b>Task Queue Bot - Справка</b>');
      expect(help).toContain('/start');
      expect(help).toContain('/status');
      expect(help).toContain('/help');
    });
  });
});
