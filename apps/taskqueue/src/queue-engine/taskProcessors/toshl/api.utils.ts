import axios from 'axios';
import { ToshlEntry, ToshlBudget } from '@tasks/lib';

const TOSHL_API_BASE_URL = 'https://api.toshl.com';

/**
 * Configuration for Toshl API operations
 */
export interface ToshlOperationParams {
  from?: string;
  to?: string;
  limit?: number;
  type?: 'expense' | 'income';
  per_page?: number;
}

/**
 * Make API request to Toshl
 */
async function makeApiRequest<T>(
  endpoint: string, 
  token: string, 
  params: Record<string, string | number> = {}
): Promise<T> {
  const response = await axios.get(`${TOSHL_API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    params,
    timeout: 30000
  });

  return response.data as T;
}

/**
 * Get expenses summary from Toshl API
 */
export async function getExpensesSummary(
  token: string, 
  params: ToshlOperationParams = {}
): Promise<ToshlEntry[]> {
  const requestParams = {
    from: params.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: params.to || new Date().toISOString().split('T')[0],
    type: 'expense'
  };

  console.log(`Fetching expenses from ${requestParams.from} to ${requestParams.to}`);
  return await makeApiRequest<ToshlEntry[]>('/entries', token, requestParams);
}

/**
 * Get recent transactions from Toshl API
 */
export async function getRecentTransactions(
  token: string, 
  params: ToshlOperationParams = {}
): Promise<ToshlEntry[]> {
  const requestParams = {
    per_page: params.limit || 10
  };

  console.log(`Fetching ${requestParams.per_page} recent transactions`);
  return await makeApiRequest<ToshlEntry[]>('/entries', token, requestParams);
}

/**
 * Get budget status from Toshl API
 */
export async function getBudgetStatus(
  token: string
): Promise<ToshlBudget[]> {
  console.log('Fetching budget status');
  return await makeApiRequest<ToshlBudget[]>('/budgets', token);
}

/**
 * Weekly summary interface
 */
export interface ToshlWeeklySummary {
  currentWeek: ToshlEntry[];
  previousWeek: ToshlEntry[];
  weekStartDate: string;
  weekEndDate: string;
  previousWeekStartDate: string;
  previousWeekEndDate: string;
}

/**
 * Get weekly summary from Toshl API
 */
export async function getWeeklySummary(
  token: string, 
  params: ToshlOperationParams = {}
): Promise<ToshlWeeklySummary> {
  // Calculate current week dates (Monday to Sunday)
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Convert Sunday to 6

  // Current week start (Monday) and end (Sunday)
  const weekStartDate = new Date(now);
  weekStartDate.setDate(now.getDate() - daysFromMonday);
  weekStartDate.setHours(0, 0, 0, 0);

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  weekEndDate.setHours(23, 59, 59, 999);

  // Previous week dates
  const previousWeekStartDate = new Date(weekStartDate);
  previousWeekStartDate.setDate(weekStartDate.getDate() - 7);

  const previousWeekEndDate = new Date(weekEndDate);
  previousWeekEndDate.setDate(weekEndDate.getDate() - 7);

  console.log(`Fetching weekly summary: current week ${weekStartDate.toISOString().split('T')[0]} to ${weekEndDate.toISOString().split('T')[0]}`);

  // Fetch current week expenses
  const currentWeekParams = {
    from: weekStartDate.toISOString().split('T')[0],
    to: weekEndDate.toISOString().split('T')[0],
    type: 'expense'
  };

  // Fetch previous week expenses for comparison
  const previousWeekParams = {
    from: previousWeekStartDate.toISOString().split('T')[0],
    to: previousWeekEndDate.toISOString().split('T')[0],
    type: 'expense'
  };

  const [currentWeek, previousWeek] = await Promise.all([
    makeApiRequest<ToshlEntry[]>('/entries', token, currentWeekParams),
    makeApiRequest<ToshlEntry[]>('/entries', token, previousWeekParams)
  ]);

  return {
    currentWeek,
    previousWeek,
    weekStartDate: weekStartDate.toISOString().split('T')[0],
    weekEndDate: weekEndDate.toISOString().split('T')[0],
    previousWeekStartDate: previousWeekStartDate.toISOString().split('T')[0],
    previousWeekEndDate: previousWeekEndDate.toISOString().split('T')[0]
  };
}
