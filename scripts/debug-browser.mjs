import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Navigating to http://localhost:3000/products?category=vitamins-and-supplements...");
  await page.goto("http://localhost:3000/products?category=vitamins-and-supplements");
  await page.waitForTimeout(5000);

  const content = await page.content();
  console.log("Has 'Limcee':", content.includes("Limcee"));
  console.log("Has 'Loading catalog':", content.includes("Loading catalog"));

  await browser.close();
}

main().catch(console.error);
