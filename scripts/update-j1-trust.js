const fs = require('fs');

// 1. update j1
let j1 = fs.readFileSync('tests/e2e/j1-guest-browsing.spec.ts', 'utf8');
j1 = j1.replace('const trustElements = page.getByText("100% Genuine Medicines", { exact: false });', 'const trustElements = page.getByText(/100% Genuine/i);');
fs.writeFileSync('tests/e2e/j1-guest-browsing.spec.ts', j1, 'utf8');
console.log('j1 trust updated');

// 2. update page.tsx hero description
let page = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');
page = page.replace('Order genuine medicines, consult licensed doctors online, and get doorstep delivery', 'Order genuine medicines, wellness essentials, and get doorstep delivery');
fs.writeFileSync('apps/web/src/app/page.tsx', page, 'utf8');
console.log('page.tsx hero updated');
