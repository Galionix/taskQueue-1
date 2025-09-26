import { Browser } from 'puppeteer';

/**
 * Closes all about:blank tabs except one if no other tabs exist
 * @param browser Browser instance
 */
export async function closeEmptyTabs(browser: Browser): Promise<void> {
  try {
    const pages = await browser.pages();
    console.log(`📋 Found ${pages.length} total pages`);
    
    // Filter about:blank pages
    const blankPages = pages.filter(page => page.url() === 'about:blank');
    const nonBlankPages = pages.filter(page => page.url() !== 'about:blank');
    
    console.log(`🔍 Found ${blankPages.length} blank pages and ${nonBlankPages.length} non-blank pages`);
    
    if (blankPages.length === 0) {
      console.log('✅ No blank pages to clean');
      return;
    }
    
    // If we have other pages, close all blank pages
    if (nonBlankPages.length > 0) {
      console.log(`🧹 Closing all ${blankPages.length} blank pages (keeping ${nonBlankPages.length} non-blank pages)`);
      
      for (const page of blankPages) {
        try {
          await page.close();
          console.log('🗑️ Closed blank page');
        } catch (error) {
          console.warn('⚠️ Failed to close blank page:', error);
        }
      }
    } else {
      // If we only have blank pages, keep one and close the rest
      if (blankPages.length > 1) {
        console.log(`🧹 Keeping 1 blank page, closing ${blankPages.length - 1} extra blank pages`);
        
        const pagesToClose = blankPages.slice(1); // Keep the first one
        for (const page of pagesToClose) {
          try {
            await page.close();
            console.log('🗑️ Closed extra blank page');
          } catch (error) {
            console.warn('⚠️ Failed to close extra blank page:', error);
          }
        }
      } else {
        console.log('✅ Only one blank page exists, keeping it to prevent browser closure');
      }
    }
    
    const remainingPages = await browser.pages();
    console.log(`✅ Browser cleanup complete. Remaining pages: ${remainingPages.length}`);
    
  } catch (error) {
    console.error('❌ Error during browser tab cleanup:', error);
  }
}
