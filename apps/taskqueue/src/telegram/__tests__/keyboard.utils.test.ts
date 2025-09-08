import { KeyboardUtils } from '../utils/keyboard.utils';

describe('KeyboardUtils', () => {
  describe('createControlKeyboard', () => {
    it('should create control keyboard with correct structure', () => {
      const keyboard = KeyboardUtils.createControlKeyboard();
      
      expect(keyboard.inline_keyboard).toBeDefined();
      expect(keyboard.inline_keyboard.length).toBe(3);
      expect(keyboard.inline_keyboard[0].length).toBe(2);
      expect(keyboard.inline_keyboard[1].length).toBe(2);
      expect(keyboard.inline_keyboard[2].length).toBe(2);
    });

    it('should have correct button texts', () => {
      const keyboard = KeyboardUtils.createControlKeyboard();
      const allButtons = keyboard.inline_keyboard.flat();
      const buttonTexts = allButtons.map(btn => btn.text);
      
      expect(buttonTexts).toContain('▶️ Start Queue 1');
      expect(buttonTexts).toContain('⏹️ Stop Queue 1');
      expect(buttonTexts).toContain('📊 Status');
      expect(buttonTexts).toContain('🔄 Restart Engine');
      expect(buttonTexts).toContain('🌐 Open Google');
      expect(buttonTexts).toContain('🔍 Count Elements');
    });

    it('should have callback_data for all buttons', () => {
      const keyboard = KeyboardUtils.createControlKeyboard();
      const allButtons = keyboard.inline_keyboard.flat();
      
      allButtons.forEach(button => {
        expect(button.callback_data).toBeDefined();
        expect(typeof button.callback_data).toBe('string');
        expect(button.callback_data.length).toBeGreaterThan(0);
      });
    });

    it('should have correct callback data values', () => {
      const keyboard = KeyboardUtils.createControlKeyboard();
      const allButtons = keyboard.inline_keyboard.flat();
      const callbackData = allButtons.map(btn => btn.callback_data);
      
      expect(callbackData).toContain('start_queue_1');
      expect(callbackData).toContain('stop_queue_1');
      expect(callbackData).toContain('status');
      expect(callbackData).toContain('restart_engine');
      expect(callbackData).toContain('execute_task_browser_open');
      expect(callbackData).toContain('execute_task_find_elements');
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

  describe('createConfirmationKeyboard', () => {
    it('should create confirmation keyboard', () => {
      const action = 'test_action';
      const keyboard = KeyboardUtils.createConfirmationKeyboard(action);
      
      expect(keyboard.inline_keyboard).toBeDefined();
      expect(keyboard.inline_keyboard.length).toBe(1);
      expect(keyboard.inline_keyboard[0].length).toBe(2);
      
      const buttons = keyboard.inline_keyboard[0];
      expect(buttons[0].text).toBe('✅ Confirm');
      expect(buttons[0].callback_data).toBe(`confirm_${action}`);
      expect(buttons[1].text).toBe('❌ Cancel');
      expect(buttons[1].callback_data).toBe('cancel');
    });
  });
});
