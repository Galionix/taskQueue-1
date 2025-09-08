/**
 * Utility function to open a browser tab with specified URL
 * Checks if tab is already open, if yes - brings it to front
 * If no - opens new tab and navigates to URL
 */
export async function openOrFocusTab(browser: any, url: string): Promise<any> {
  const pages = await browser.pages();

  // Check if the URL is already open in any tab
  const existingTab = pages.find((page: any) => page.url().includes(url));

  if (existingTab) {
    // Tab with URL is already open, bring it to the front
    await existingTab.bringToFront();
    console.log(
      `Tab with URL ${url} is already open, bringing it to the front.`
    );
    return existingTab;
  } else {
    // Open a new tab with the specified URL
    const newPage = await browser.newPage();
    await newPage.goto(url);

    // Wait 5 seconds to ensure the page is loaded
    const wait = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    await wait(5000);

    console.log(`Opened new tab with URL: ${url}`);
    return newPage;
  }
}
