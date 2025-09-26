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
