// Local types for Toshl
interface ToshlCategory {
  id: string;
  name: string;
  type: string;
  created: string;
  modified: string;
  deleted: boolean;
}

interface ToshlEntry {
  id: string;
  amount: number;
  currency: {
    code: string;
    rate: number;
    main_rate: number;
    fixed: false;
  };
  date: string;
  desc: string;
  account: string;
  category?: string;
  tags?: string[];
  created: string;
  modified: string;
  completed: boolean;
  deleted: boolean;
}

interface ToshlBudget {
  id: string;
  name: string;
  amount: number;
  currency: {
    code: string;
    rate: number;
    main_rate: number;
    fixed: false;
  };
  spent?: number;
  period?: string;
}

import axios from 'axios';

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

/**
 * Get category names by their IDs
 */
async function getCategoryNames(categoryIds: string[], token: string): Promise<{[key: string]: string}> {
  const categoryNames: {[key: string]: string} = {};
  
  try {
    // Fetch all categories
    const response = await axios.get('https://toshl.com/api/categories', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && Array.isArray(response.data)) {
      const categories: ToshlCategory[] = response.data;
      categories.forEach(category => {
        if (categoryIds.includes(category.id)) {
          categoryNames[category.id] = category.name;
        }
      });
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return fallback names if API call fails
    categoryIds.forEach(id => {
      categoryNames[id] = `Category ${id.substring(0, 8)}`;
    });
  }

  return categoryNames;
}

/**
 * Format weekly summary message
 */
export async function formatWeeklySummary(
  weeklySummary: import('./api.utils').ToshlWeeklySummary, 
  token: string
): Promise<string> {
  const { currentWeek, previousWeek, weekStartDate, weekEndDate } = weeklySummary;
  
  // Format dates for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  let formattedMessage = `📊 Финансовая сводка за неделю (${formatDate(weekStartDate)} - ${formatDate(weekEndDate)})\n\n`;

  // Calculate current week totals
  let currentWeekTotal = 0;
  const currentWeekCategoryTotals: { [key: string]: number } = {};
  const dailyTotals: { [key: string]: number } = {};

  // Collect category IDs for current week
  const uniqueCategoryIds = new Set<string>();
  currentWeek.forEach((entry) => {
    const amount = Math.abs(entry.amount);
    currentWeekTotal += amount;
    
    // Group by category
    if (entry.category) {
      currentWeekCategoryTotals[entry.category] = (currentWeekCategoryTotals[entry.category] || 0) + amount;
      uniqueCategoryIds.add(entry.category);
    }
    
    // Group by day
    const dayKey = entry.date;
    dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + amount;
  });

  // Calculate previous week total for comparison
  let previousWeekTotal = 0;
  previousWeek.forEach((entry) => {
    previousWeekTotal += Math.abs(entry.amount);
  });

  // Get currency from first entry
  const mainCurrency = currentWeek[0]?.currency?.code || 'UAH';

  // Main totals
  formattedMessage += `💰 Общие расходы: ${currentWeekTotal.toFixed(2)} ${mainCurrency}\n`;
  
  // Comparison with previous week
  if (previousWeekTotal > 0) {
    const changePercent = ((currentWeekTotal - previousWeekTotal) / previousWeekTotal * 100).toFixed(1);
    const changeEmoji = parseFloat(changePercent) > 0 ? '📈' : '📉';
    const changeSign = parseFloat(changePercent) > 0 ? '+' : '';
    formattedMessage += `${changeEmoji} Изменение: ${changeSign}${changePercent}% к прошлой неделе\n`;
  }

  // Average daily spending
  const averageDaily = currentWeekTotal / 7;
  formattedMessage += `📅 Средние расходы в день: ${averageDaily.toFixed(2)} ${mainCurrency}\n\n`;

  // Top categories
  if (Object.keys(currentWeekCategoryTotals).length > 0) {
    const topCategories = Object.entries(currentWeekCategoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Get category names
    const categoryIds = Array.from(uniqueCategoryIds);
    const categoryNames = await getCategoryNames(categoryIds, token);

    formattedMessage += `🏆 Топ категорий:\n`;
    topCategories.forEach(([categoryId, amount], index) => {
      const categoryName = categoryNames[categoryId] || `Category ${categoryId}`;
      const percentage = ((amount / currentWeekTotal) * 100).toFixed(1);
      const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index] || '•';
      formattedMessage += `  ${emoji} ${categoryName}: ${amount.toFixed(2)} ${mainCurrency} (${percentage}%)\n`;
    });
  }

  // Daily insights
  const sortedDays = Object.entries(dailyTotals)
    .sort(([,a], [,b]) => b - a);

  if (sortedDays.length > 0) {
    formattedMessage += `\n💡 Инсайты:\n`;
    const [mostExpensiveDay, maxAmount] = sortedDays[0];
    const dayName = new Date(mostExpensiveDay).toLocaleDateString('ru-RU', { weekday: 'long' });
    formattedMessage += `  • Самый дорогой день: ${dayName} (${maxAmount.toFixed(2)} ${mainCurrency})\n`;
    
    // Add spending pattern insight
    if (currentWeekTotal > 0) {
      if (currentWeekTotal > previousWeekTotal * 1.2) {
        formattedMessage += `  • ⚠️ Расходы значительно выросли на ${((currentWeekTotal - previousWeekTotal) / previousWeekTotal * 100).toFixed(1)}%\n`;
      } else if (currentWeekTotal < previousWeekTotal * 0.8) {
        formattedMessage += `  • ✅ Экономия: расходы снижены на ${((previousWeekTotal - currentWeekTotal) / previousWeekTotal * 100).toFixed(1)}%\n`;
      }
    }
  }

  return formattedMessage;
}
