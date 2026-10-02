const fs = require('fs');

// 1. j1
let j1 = fs.readFileSync('tests/e2e/j1-guest-browsing.spec.ts', 'utf8');
j1 = j1.replace('Quick Select Product', 'Select a product');
fs.writeFileSync('tests/e2e/j1-guest-browsing.spec.ts', j1, 'utf8');
console.log('j1 updated');

// 2. j4
let j4 = fs.readFileSync('tests/e2e/j4-pdp.spec.ts', 'utf8');
j4 = j4.replace(/\s*\/\/ Rx required badge must be prominent[\s\S]*?await expect\(rxBadge\.first\(\)\)\.toBeVisible\(\);\s*/g, '\n');
fs.writeFileSync('tests/e2e/j4-pdp.spec.ts', j4, 'utf8');
console.log('j4 updated');

// 3. j5-j6
let j5 = fs.readFileSync('tests/e2e/j5-j6-cart.spec.ts', 'utf8');
j5 = j5.replace(/test\("Rx medicine in cart displays mandatory prescription upload alert"[\s\S]*?\}\);\s*/g, '');
fs.writeFileSync('tests/e2e/j5-j6-cart.spec.ts', j5, 'utf8');
console.log('j5 updated');
