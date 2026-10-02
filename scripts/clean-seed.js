const fs = require('fs');

// 1. Clean apps/api/prisma/seed.ts
let seed = fs.readFileSync('apps/api/prisma/seed.ts', 'utf8');

// Remove dropped model deleteMany()
seed = seed.replace(/\s*await\s+prisma\.(appointment|doctor|labBooking|labTest|prescription)\.deleteMany\(\);/g, '');

// Remove prescriptionRequired lines
seed = seed.replace(/\s*prescriptionRequired:\s*(false|true|raw\.prescriptionRequired),?/g, '');

// Remove doctor & lab seed blocks
seed = seed.replace(/\/\/\s*6\.\s*Doctors[\s\S]*?for\s*\(const\s+lab\s+of\s+labTestsData\)\s*\{\s*await\s+prisma\.labTest\.create\(\{ data: lab \}\);\s*\}/, '');

fs.writeFileSync('apps/api/prisma/seed.ts', seed, 'utf8');
console.log('Cleaned apps/api/prisma/seed.ts');

// 2. Clean scripts/seed-extensions.mjs
let ext = fs.readFileSync('scripts/seed-extensions.mjs', 'utf8');
ext = ext.replace(/,\s*PrescriptionStatus/g, '');
ext = ext.replace(/\/\/\s*3\.\s*Create Prescriptions[\s\S]*?\/\/\s*4\.\s*Products with Prescriptions/g, '// 4. Products with Batches');
ext = ext.replace(/\s*prescriptionRequired:\s*(true|false),?/g, '');
ext = ext.replace(/\s*scheduleType:\s*"[^"]*",?/g, '');
fs.writeFileSync('scripts/seed-extensions.mjs', ext, 'utf8');
console.log('Cleaned scripts/seed-extensions.mjs');
