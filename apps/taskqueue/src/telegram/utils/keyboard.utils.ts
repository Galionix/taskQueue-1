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
   * Create queues management keyboard
   */
  static createQueuesKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '📋 Список очередей', callback_data: 'list_queues' },
        ],
        [
          { text: '📊 Статус всех', callback_data: 'status' },
          { text: '🔄 Restart Engine', callback_data: 'restart_engine' },
        ],
        [
          { text: '🏠 Главное меню', callback_data: 'main_menu' },
        ],
      ],
    };
  }

  /**
   * Create compact queue list keyboard with essential actions only
   */
  static createQueueListKeyboard(queues: Array<{ id: number; name: string; isActive?: boolean }>): InlineKeyboardMarkup {
    const buttons: InlineKeyboardButton[][] = [];

    // Добавляем только самые важные кнопки - более компактно (по 2 в ряд)
    for (const queue of queues) {
      const activeStatus = queue.isActive !== undefined ? (queue.isActive ? '🟢' : '🔴') : '⚪';

      // Основной ряд: запуск и статус  
      buttons.push([
        {
          text: `🚀 ${queue.name}`,
          callback_data: `execute_queue_${queue.id}`,
        },
        {
          text: `📊 Статус`,
          callback_data: `queue_status_${queue.id}`,
        },
      ]);

      // Дополнительные действия в одном ряду
      const activityButtonText = queue.isActive !== undefined
        ? queue.isActive ? `🔴 Выкл` : `🟢 Вкл`
        : `🔄 Переключить`;

      buttons.push([
        {
          text: `🔍 Debug`,
          callback_data: `execute_queue_debug_${queue.id}`,
        },
        {
          text: `${activeStatus} ${activityButtonText}`,
          callback_data: `toggle_activity_${queue.id}`,
        },
      ]);
    }

    // Системные кнопки
    buttons.push([
      { text: '🔄 Обновить', callback_data: 'list_queues' },
      { text: '🏠 Меню', callback_data: 'main_menu' },
    ]);

    return { inline_keyboard: buttons };
  }

  /**
   * Create compact main menu keyboard
   */
  static createMainMenuKeyboardV2(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '📋 Очереди', callback_data: 'list_queues' },
          { text: '📊 Статус', callback_data: 'status' },
        ],
        [
          { text: '🔄 Рестарт', callback_data: 'restart_engine' },
          { text: '❓ Справка', callback_data: 'help' },
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
