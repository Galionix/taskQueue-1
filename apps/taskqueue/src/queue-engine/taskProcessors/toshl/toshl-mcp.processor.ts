import { TaskModel } from '@tasks/lib';
import { taskProcessorType } from '../';
import { getExpensesSummary, getRecentTransactions, getBudgetStatus, getWeeklySummary } from './api.utils';
import { formatExpensesSummary, formatRecentTransactions, formatBudgetStatus, formatWeeklySummary } from './formatter.utils';

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

        let formattedMessage = '';
        let result: unknown = null;

        // Execute the operation
        switch (operation) {
          case 'expenses-summary': {
            const expensesData = await getExpensesSummary(toshlToken, params);
            formattedMessage = await formatExpensesSummary(expensesData, toshlToken);
            result = expensesData;
            break;
          }
          case 'recent-transactions': {
            const transactionsData = await getRecentTransactions(toshlToken, params);
            formattedMessage = await formatRecentTransactions(transactionsData, toshlToken);
            result = transactionsData;
            break;
          }
          case 'budget-status': {
            const budgetsData = await getBudgetStatus(toshlToken);
            formattedMessage = formatBudgetStatus(budgetsData);
            result = budgetsData;
            break;
          }
          case 'weekly-summary': {
            const weeklyData = await getWeeklySummary(toshlToken, params);
            formattedMessage = await formatWeeklySummary(weeklyData, toshlToken);
            result = weeklyData;
            break;
          }
          default:
            throw new Error(`Unknown operation: ${operation}`);
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
