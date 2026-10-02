const fs = require('fs');

let j1 = fs.readFileSync('tests/e2e/j1-guest-browsing.spec.ts', 'utf8');
j1 = j1.replace('const featuredHeading = page.getByText("Featured Medicines", { exact: false });', 'const featuredHeading = page.getByText(/Featured This Month/i);');
j1 = j1.replace('const bestSellersHeading = page.getByText("Best Sellers", { exact: false });', 'const bestSellersHeading = page.getByText(/Best Seller/i);');
fs.writeFileSync('tests/e2e/j1-guest-browsing.spec.ts', j1, 'utf8');
console.log('j1 headings updated');
