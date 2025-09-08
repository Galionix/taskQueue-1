import { KeyboardUtils } from '../utils/keyboard.utils';
import { MessageFormatter } from '../utils/message-formatter.utils';

describe('KeyboardUtils', () => {
  describe('createControlPanelKeyboard', () => {
    it('should create control panel keyboard with correct structure', () => {
      const keyboard = KeyboardUtils.createControlPanelKeyboard();

      expect(keyboard.inline_keyboard).toBeDefined();
      expect(keyboard.inline_keyboard.length).toBeGreaterThan(0);

      // Check for expected buttons
      const allButtons = keyboard.inline_keyboard.flat();
      const buttonTexts = allButtons.map(btn => btn.text);

      expect(buttonTexts).toContain('▶️ Start Queue');
      expect(buttonTexts).toContain('⏹️ Stop Queue');
      expect(buttonTexts).toContain('📊 Status');
      expect(buttonTexts).toContain('🔄 Restart Engine');
    });

    it('should have callback_data for all buttons', () => {
      const keyboard = KeyboardUtils.createControlPanelKeyboard();
      const allButtons = keyboard.inline_keyboard.flat();

      allButtons.forEach(button => {
        expect(button.callback_data).toBeDefined();
        expect(typeof button.callback_data).toBe('string');
      });
    });
  });

  describe('createMainMenuKeyboard', () => {
    it('should create main menu keyboard with correct structure', () => {
      const keyboard = KeyboardUtils.createMainMenuKeyboard();

      expect(keyboard.inline_keyboard).toBeDefined();
      expect(keyboard.inline_keyboard.length).toBeGreaterThan(0);

      const allButtons = keyboard.inline_keyboard.flat();
      expect(allButtons.length).toBeGreaterThan(0);

      allButtons.forEach(button => {
        expect(button.text).toBeDefined();
        expect(button.callback_data).toBeDefined();
      });
    });
  });
});

describe('MessageFormatter', () => {
  describe('formatSystemStatus', () => {
    it('should format system status correctly', () => {
      const mockStatus = {
        activeQueues: 2,
        activeTasks: 5,
        memory: 150.5,
        uptime: 3661, // 1h 1m 1s
        queueEngineStatus: 'running',
        browserStatus: 'active'
      };

      const formatted = MessageFormatter.formatSystemStatus(mockStatus);

      expect(formatted).toContain('📊 **System Status**');
      expect(formatted).toContain('Active Queues: 2');
      expect(formatted).toContain('Active Tasks: 5');
      expect(formatted).toContain('Memory: 150.5 MB');
      expect(formatted).toContain('Uptime: 1h 1m 1s');
      expect(formatted).toContain('Engine: running');
      expect(formatted).toContain('Browser: active');
    });

    it('should handle zero values correctly', () => {
      const mockStatus = {
        activeQueues: 0,
        activeTasks: 0,
        memory: 0,
        uptime: 0,
        queueEngineStatus: 'stopped',
        browserStatus: 'inactive'
      };

      const formatted = MessageFormatter.formatSystemStatus(mockStatus);

      expect(formatted).toContain('Active Queues: 0');
      expect(formatted).toContain('Active Tasks: 0');
      expect(formatted).toContain('Memory: 0 MB');
      expect(formatted).toContain('Uptime: 0s');
      expect(formatted).toContain('Engine: stopped');
      expect(formatted).toContain('Browser: inactive');
    });
  });

  describe('formatHelpMessage', () => {
    it('should return help message', () => {
      const help = MessageFormatter.formatHelpMessage();

      expect(help).toContain('🤖 **Bot Commands**');
      expect(help).toContain('/start');
      expect(help).toContain('/status');
      expect(help).toContain('/help');
    });
  });

  describe('formatUnauthorizedMessage', () => {
    it('should return unauthorized message', () => {
      const message = MessageFormatter.formatUnauthorizedMessage();

      expect(message).toContain('❌');
      expect(message).toContain('unauthorized');
    });
  });
});
