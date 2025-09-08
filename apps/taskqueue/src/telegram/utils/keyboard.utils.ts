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
   * Create queue list keyboard with dynamic buttons for each queue
   */
  static createQueueListKeyboard(queues: Array<{ id: number; name: string }>): InlineKeyboardMarkup {
    const buttons: InlineKeyboardButton[][] = [];
    
    // Добавляем кнопки для каждой очереди (по 2 в ряд)
    for (let i = 0; i < queues.length; i += 2) {
      const row: InlineKeyboardButton[] = [];
      
      // Первая очередь в ряду
      const queue1 = queues[i];
      row.push({
        text: `🚀 ${queue1.name}`,
        callback_data: `execute_queue_${queue1.id}`
      });
      
      // Вторая очередь в ряду (если есть)
      if (i + 1 < queues.length) {
        const queue2 = queues[i + 1];
        row.push({
          text: `🚀 ${queue2.name}`,
          callback_data: `execute_queue_${queue2.id}`
        });
      }
      
      buttons.push(row);
    }
    
    // Добавляем кнопки статуса для каждой очереди
    for (let i = 0; i < queues.length; i += 2) {
      const row: InlineKeyboardButton[] = [];
      
      // Статус первой очереди
      const queue1 = queues[i];
      row.push({
        text: `📊 ${queue1.name}`,
        callback_data: `queue_status_${queue1.id}`
      });
      
      // Статус второй очереди (если есть)
      if (i + 1 < queues.length) {
        const queue2 = queues[i + 1];
        row.push({
          text: `📊 ${queue2.name}`,
          callback_data: `queue_status_${queue2.id}`
        });
      }
      
      buttons.push(row);
    }
    
    // Добавляем кнопки навигации
    buttons.push([
      { text: '🔄 Обновить список', callback_data: 'list_queues' },
      { text: '🏠 Главное меню', callback_data: 'main_menu' },
    ]);
    
    return { inline_keyboard: buttons };
  }

  /**
   * Create updated main menu keyboard with queues management
   */
  static createMainMenuKeyboardV2(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '📋 Управление очередями', callback_data: 'queues_menu' },
        ],
        [
          { text: '📊 Общий статус', callback_data: 'status' },
          { text: '🔄 Restart Engine', callback_data: 'restart_engine' },
        ],
        [
          { text: '❓ Помощь', callback_data: 'help' },
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
