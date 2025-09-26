import { ToshlEntry, ToshlBudget } from '@tasks/lib';
import { getCategoryNames } from './category.utils';

/**
 * Format expenses summary message
 */
export async function formatExpensesSummary(
  entries: ToshlEntry[], 
  token: string
): Promise<string> {
  let formattedMessage = `💰 Toshl Finance Summary:\n`;
  
  if (entries.length === 0) {
    return formattedMessage + 'No expenses found for the specified period.\n';
  }

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
  const categoryIds = Array.from(uniqueCategoryIds);
  const categoryNames = await getCategoryNames(categoryIds, token);

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
      const categoryName = categoryNames[entry.category] || `Category ${entry.category}`;
      categoryInfo = ` (${categoryName})`;
    }
    formattedMessage += `  • ${entry.date}: ${entry.desc}${categoryInfo} - ${entry.amount.toFixed(2)} ${entry.currency.code}\n`;
  }

  return formattedMessage;
}

/**
 * Format recent transactions message
 */
export async function formatRecentTransactions(
  entries: ToshlEntry[], 
  token: string
): Promise<string> {
  let formattedMessage = `📋 Recent Transactions:\n`;
  
  if (entries.length === 0) {
    return formattedMessage + 'No recent transactions found.\n';
  }

  // Process entries and get category names
  for (const entry of entries) {
    let categoryInfo = '';
    if (entry.category) {
      const categoryNames = await getCategoryNames([entry.category], token);
      const categoryName = categoryNames[entry.category];
      categoryInfo = ` (${categoryName})`;
    }
    formattedMessage += `  • ${entry.date}: ${entry.desc}${categoryInfo} - ${entry.amount.toFixed(2)} ${entry.currency.code}\n`;
  }

  return formattedMessage;
}

/**
 * Format budget status message
 */
export function formatBudgetStatus(budgets: ToshlBudget[]): string {
  let formattedMessage = `📊 Budget Status:\n`;
  
  if (budgets.length === 0) {
    return formattedMessage + 'No budgets found\n';
  }

  budgets.forEach((budget) => {
    const spent = budget.spent || 0;
    const limit = budget.amount || 0;
    const percentage = limit > 0 ? ((spent / limit) * 100).toFixed(1) : '0';
    formattedMessage += `  • ${budget.name}: ${spent.toFixed(2)}/${limit.toFixed(2)} ${budget.currency.code} (${percentage}%)\n`;
  });

  return formattedMessage;
}
