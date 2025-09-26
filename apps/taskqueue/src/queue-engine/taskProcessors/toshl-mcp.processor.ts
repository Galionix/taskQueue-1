import { TaskModel } from '@tasks/lib';
import axios from 'axios';

import { taskProcessorType } from './';
import { getWeeklySummary } from './toshl/api.utils';
import { formatWeeklySummary } from './toshl/formatter.utils';

// Toshl API types
interface ToshlCurrency {
  code: string;
  rate: number;
  main_rate: number;
  fixed: false;
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

interface ToshlCategory {
  id: string;
  name: string;
  type: string;
  created: string;
  modified: string;
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

// In-memory cache for categories
const categoryCache = new Map<string, string>();

// Helper function to get category name
async function getCategoryName(categoryId: string, token: string): Promise<string> {
  // Check cache first
  if (categoryCache.has(categoryId)) {
    const cachedName = categoryCache.get(categoryId);
    if (cachedName) {
      return cachedName;
    }
  }

  try {
    // Fetch category from API
    console.log(`Fetching category ${categoryId} from Toshl API`);
    const response = await axios.get(`https://api.toshl.com/categories/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const category = response.data as ToshlCategory;
    const categoryName = category.name || `Category ${categoryId}`;

    // Cache the result
    categoryCache.set(categoryId, categoryName);
    console.log(`Cached category ${categoryId}: ${categoryName}`);

    return categoryName;
  } catch (error) {
    console.error(`Failed to fetch category ${categoryId}:`, error);
    // Fallback to ID if API call fails
    const fallbackName = `Category ${categoryId}`;
    categoryCache.set(categoryId, fallbackName);
    return fallbackName;
  }
}



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

        // Handle special operations that don't need direct API calls
        if (operation === 'weekly-summary') {
          console.log('Processing weekly-summary operation');
          
          const weeklySummary = await getWeeklySummary(toshlToken);
          const formattedMessage = await formatWeeklySummary(weeklySummary, toshlToken);
          
          storage.message += `\n${formattedMessage}`;
          
          console.log(`✅ Toshl weekly summary completed successfully`);
          return {
            success: true,
            data: weeklySummary,
            operation,
            summary: formattedMessage.trim()
          };
        }

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

        // Format the message based on operation
        let formattedMessage = '';
        switch (operation) {
          case 'expenses-summary':
            formattedMessage = `💰 Toshl Finance Summary:\n`;
            if (Array.isArray(result)) {
              const entries = result as ToshlEntry[];
              let totalAmount = 0;
              const categoryTotals: { [key: string]: number } = {};

              // First pass: collect category IDs and calculate totals
              const uniqueCategoryIds = new Set<string>();
              entries.forEach((entry) => {
                totalAmount += Math.abs(entry.amount);
                if (entry.category) {
                  const categoryId = entry.category;
                  categoryTotals[categoryId] = (categoryTotals[categoryId] || 0) + Math.abs(entry.amount);
                  uniqueCategoryIds.add(categoryId);
                }
              });

              // Resolve category names from cache or API
              const categoryNames: { [key: string]: string } = {};
              const categoryIds = Array.from(uniqueCategoryIds);

              // Process categories in parallel
              await Promise.all(categoryIds.map(async (categoryId) => {
                const name = await getCategoryName(categoryId, toshlToken);
                categoryNames[categoryId] = name;
              }));

              const mainCurrency = entries[0]?.currency?.code || 'UAH';
              formattedMessage += `Total Expenses: ${totalAmount.toFixed(2)} ${mainCurrency}\n`;
              formattedMessage += `Entries: ${entries.length}\n`;

              const topCategories = Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);

              if (topCategories.length > 0) {
                formattedMessage += `Top Categories:\n`;
                topCategories.forEach(([categoryId, amount]) => {
                  const categoryName = categoryNames[categoryId] || `Category ${categoryId}`;
                  formattedMessage += `  • ${categoryName}: ${amount.toFixed(2)} ${mainCurrency}\n`;
                });
              }

              // Show recent entries with category names
              formattedMessage += `\nRecent Transactions:\n`;
              const recentEntries = entries.slice(0, 5);
              for (const entry of recentEntries) {
                let categoryInfo = '';
                if (entry.category) {
                  const categoryName = categoryNames[entry.category] || await getCategoryName(entry.category, toshlToken);
                  categoryInfo = ` (${categoryName})`;
                }
                formattedMessage += `  • ${entry.date}: ${entry.desc}${categoryInfo} - ${entry.amount.toFixed(2)} ${entry.currency.code}\n`;
              }
            }
            break;
          case 'recent-transactions':
            formattedMessage = `📋 Recent Transactions:\n`;
            if (Array.isArray(result)) {
              const entries = result as ToshlEntry[];

              // Process entries and get category names
              for (const entry of entries) {
                let categoryInfo = '';
                if (entry.category) {
                  const categoryName = await getCategoryName(entry.category, toshlToken);
                  categoryInfo = ` (${categoryName})`;
                }
                formattedMessage += `  • ${entry.date}: ${entry.desc}${categoryInfo} - ${entry.amount.toFixed(2)} ${entry.currency.code}\n`;
              }
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
