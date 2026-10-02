const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  const categories = await page.locator('a[href*="/products?category="]').allTextContents();
  const prodCardCount = await page.locator('button:has-text("Add")').count();
  
  console.log(`Rendered ${categories.length} categories:`, categories.slice(0, 8));
  console.log(`Rendered ${prodCardCount} product action buttons on Home`);
  
  await browser.close();
})();
