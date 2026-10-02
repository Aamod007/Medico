const fs = require('fs');

let h = fs.readFileSync('apps/web/src/components/Header.tsx', 'utf8');
h = h.replace('className="hidden md:flex flex-1 max-w-2xl', 'className="hidden lg:flex flex-1 max-w-2xl');
fs.writeFileSync('apps/web/src/components/Header.tsx', h, 'utf8');
console.log('Header search visibility adjusted for tablet');
