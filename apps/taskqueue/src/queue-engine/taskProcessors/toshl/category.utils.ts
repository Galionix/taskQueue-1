import axios from 'axios';
import { ToshlCategory } from '@tasks/lib';

// In-memory cache for categories
const categoryCache = new Map<string, string>();

/**
 * Get category name by ID, using cache first, then API if needed
 * @param categoryId - Toshl category ID
 * @param token - Toshl API token
 * @returns Promise<string> - Category name
 */
export async function getCategoryName(categoryId: string, token: string): Promise<string> {
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

/**
 * Get multiple category names in parallel
 * @param categoryIds - Array of category IDs
 * @param token - Toshl API token
 * @returns Promise<{[key: string]: string}> - Map of category ID to name
 */
export async function getCategoryNames(categoryIds: string[], token: string): Promise<{[key: string]: string}> {
  const categoryNames: { [key: string]: string } = {};
  
  // Process categories in parallel
  await Promise.all(categoryIds.map(async (categoryId) => {
    const name = await getCategoryName(categoryId, token);
    categoryNames[categoryId] = name;
  }));

  return categoryNames;
}

/**
 * Clear category cache (useful for testing or memory management)
 */
export function clearCategoryCache(): void {
  categoryCache.clear();
  console.log('Category cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: categoryCache.size,
    keys: Array.from(categoryCache.keys())
  };
}
