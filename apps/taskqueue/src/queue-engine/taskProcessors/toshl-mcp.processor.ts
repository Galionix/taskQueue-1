import { TaskModel } from '@tasks/lib';
import axios from 'axios';

import { taskProcessorType } from './';

// Toshl API types
interface ToshlCurrency {
  code: string;
  rate: number;
  main_rate: number;
  fixed: boolean;
}

interface ToshlEntry {
  id: string;
  amount: number;
  currency: ToshlCurrency;
  date: string;
  desc: string;
  account: string;
  category?: string;
  tags?: string[];
  created: string;
  modified: string;
  import?: {
    connection: string;
    pending: boolean;
  };
  completed: boolean;
  deleted: boolean;
}

interface ToshlBudget {
  id: string;
  name: string;
  amount: number;
  currency: ToshlCurrency;
  spent?: number;
  period?: string;
}

// Response types are just arrays
// type ToshlEntriesResponse = ToshlEntry[];
// type ToshlBudgetsResponse = ToshlBudget[];

export const toshlMcpProcessor = (): taskProcessorType => {
  return {
    name: 'toshlMcpProcessor',
    description: 'Gets financial data from Toshl Finance API',
    blocks: [], // No resource blocks needed for API calls
    execute: async (data: TaskModel, storage) => {
      try {
        const payload = JSON.parse(data.payload);
        const { operation, params = {} } = payload;

        // Get token from environment variable
        const toshlToken = process.env.TOSHL_API_TOKEN;
        if (!toshlToken) {
          throw new Error('TOSHL_API_TOKEN environment variable is required for Toshl integration');
        }

        console.log(`Making Toshl API request: ${operation}`);

        let apiUrl = '';
        let requestData: Record<string, string | number> = {};

        // Determine the operation and prepare request to Toshl API directly
        switch (operation) {
          case 'expenses-summary':
            apiUrl = 'https://api.toshl.com/entries';
            requestData = {
              from: params.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              to: params.to || new Date().toISOString().split('T')[0],
              type: 'expense'
            };
            break;
          case 'recent-transactions':
            apiUrl = 'https://api.toshl.com/entries';
            requestData = {
              per_page: params.limit || 10
            };
            break;
          case 'budget-status':
            apiUrl = 'https://api.toshl.com/budgets';
            requestData = {};
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        // Make direct API request to Toshl
        const response = await axios.get(apiUrl, {
          headers: {
            'Authorization': `Bearer ${toshlToken}`,
            'Content-Type': 'application/json'
          },
          params: requestData,
          timeout: 30000
        });

        const result = response.data;
        console.log('result: ', result);

        // Format the message based on operation
        let formattedMessage = '';
        switch (operation) {
          case 'expenses-summary':
            formattedMessage = `💰 Toshl Finance Summary:\n`;
            if (Array.isArray(result)) {
              const entries = result as ToshlEntry[];
              let totalAmount = 0;
              const categoryTotals: { [key: string]: number } = {};
              const categoryNames: { [key: string]: string } = {}; // For mapping category IDs to names

              entries.forEach((entry) => {
                totalAmount += Math.abs(entry.amount);
                if (entry.category) {
                  const categoryId = entry.category;
                  categoryTotals[categoryId] = (categoryTotals[categoryId] || 0) + Math.abs(entry.amount);
                  categoryNames[categoryId] = `Category ${categoryId}`; // We'll use ID as name for now
                }
              });

              const mainCurrency = entries[0]?.currency?.code || 'UAH';
              formattedMessage += `Total Expenses: ${totalAmount.toFixed(2)} ${mainCurrency}\n`;
              formattedMessage += `Entries: ${entries.length}\n`;

              const topCategories = Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);

              if (topCategories.length > 0) {
                formattedMessage += `Top Categories:\n`;
                topCategories.forEach(([categoryId, amount]) => {
                  formattedMessage += `  • ${categoryNames[categoryId]}: ${amount.toFixed(2)} ${mainCurrency}\n`;
                });
              }

              // Show recent entries
              formattedMessage += `\nRecent Transactions:\n`;
              entries.slice(0, 5).forEach((entry) => {
                formattedMessage += `  • ${entry.date}: ${entry.desc} - ${entry.amount.toFixed(2)} ${entry.currency.code}\n`;
              });
            }
            break;
          case 'recent-transactions':
            formattedMessage = `📋 Recent Transactions:\n`;
            if (Array.isArray(result)) {
              const entries = result as ToshlEntry[];
              entries.forEach((entry) => {
                formattedMessage += `  • ${entry.date}: ${entry.desc} - ${entry.amount.toFixed(2)} ${entry.currency.code}\n`;
              });
            }
            break;
          case 'budget-status':
            formattedMessage = `📊 Budget Status:\n`;
            if (Array.isArray(result)) {
              const budgets = result as ToshlBudget[];
              if (budgets.length > 0) {
                budgets.forEach((budget) => {
                  const spent = budget.spent || 0;
                  const limit = budget.amount || 0;
                  const percentage = limit > 0 ? ((spent / limit) * 100).toFixed(1) : '0';
                  formattedMessage += `  • ${budget.name}: ${spent.toFixed(2)}/${limit.toFixed(2)} ${budget.currency.code} (${percentage}%)\n`;
                });
              } else {
                formattedMessage += `No budgets found\n`;
              }
            } else {
              formattedMessage += `Found ${Array.isArray(result) ? result.length : 0} budgets\n`;
            }
            break;
        }

        storage.message += `\n${formattedMessage}`;

        console.log(`✅ Toshl MCP operation '${operation}' completed successfully`);
        return {
          success: true,
          data: result,
          operation,
          summary: formattedMessage.trim()
        };

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const fullErrorMessage = `❌ Toshl MCP Error: ${errorMessage}`;
        storage.message += `\n${fullErrorMessage}`;
        console.error('Toshl MCP processor error:', error);

        return {
          success: false,
          error: errorMessage,
          details: error instanceof Error ? error.stack : String(error)
        };
      }
    },
  };
};
