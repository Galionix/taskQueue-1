/**
 * Telegram keyboard utilities
 */

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
  login_url?: any;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
  callback_game?: any;
  pay?: boolean;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export class KeyboardUtils {
  /**
   * Create control panel keyboard for task queue management
   */
  static createControlKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '▶️ Start Queue 1', callback_data: 'start_queue_1' },
          { text: '⏹️ Stop Queue 1', callback_data: 'stop_queue_1' },
        ],
        [
          { text: '📊 Status', callback_data: 'status' },
          { text: '🔄 Restart Engine', callback_data: 'restart_engine' },
        ],
        [
          {
            text: '🌐 Open Google',
            callback_data: 'execute_task_browser_open',
          },
          {
            text: '🔍 Count Elements',
            callback_data: 'execute_task_find_elements',
          },
        ],
      ],
    };
  }

  /**
   * Create main menu keyboard
   */
  static createMainMenuKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '📊 Status', callback_data: 'status' },
          { text: '🔄 Restart', callback_data: 'restart_engine' },
        ],
        [
          { text: '❓ Help', callback_data: 'help' },
          { text: '🔒 Security', callback_data: 'security' },
        ],
      ],
    };
  }

  /**
   * Create confirmation keyboard
   */
  static createConfirmationKeyboard(action: string): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '✅ Confirm', callback_data: `confirm_${action}` },
          { text: '❌ Cancel', callback_data: 'cancel' },
        ],
      ],
    };
  }
}
