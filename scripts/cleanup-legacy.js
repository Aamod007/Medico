const fs = require('fs');

// 1. Header.tsx: Remove lab-tests and consultations links
let header = fs.readFileSync('apps/web/src/components/Header.tsx', 'utf8');
header = header.replace(/\s*<Link\s+href="\/lab-tests"[\s\S]*?<\/Link>/g, '');
header = header.replace(/\s*<Link\s+href="\/consultations"[\s\S]*?<\/Link>/g, '');
fs.writeFileSync('apps/web/src/components/Header.tsx', header, 'utf8');
console.log('1. Header.tsx updated');

// 2. page.tsx: update section 4 and remove doctor FAQ
let page = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');
page = page.replace(/\{\s*q:\s*"Can I consult a doctor directly through Pharmico\?",[\s\S]*?\},\s*/g, '');
page = page.replace(
  /<div className="bg-\[#E6F4B8\][\s\S]*?<\/section>/,
  `<div className="bg-[#E6F4B8] rounded-[28px] p-8 xl:p-10 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition">
            <div>
              <span className="text-xs font-bold text-[#0B4A3A] uppercase tracking-wider">
                100% Genuine Guarantee
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#0B4A3A] mt-2 leading-snug">
                Directly from Certified Manufacturers
              </h3>
              <p className="text-xs sm:text-sm text-[#0B4A3A]/80 mt-2 leading-relaxed">
                Every strip and bottle is sourced from WHO-GMP certified facilities with verified batch tracking.
              </p>
            </div>
            <div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0B4A3A] text-white text-xs sm:text-sm font-bold hover:bg-[#07362a] transition shadow-sm"
              >
                <span>Shop Medicines</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Peach Card */}
          <div className="bg-[#FDE6D3] rounded-[28px] p-8 xl:p-10 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition">
            <div>
              <span className="text-xs font-bold text-[#8A4A1C] uppercase tracking-wider">
                Express Cold-Chain
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#8A4A1C] mt-2 leading-snug">
                Safe 2°C - 8°C Temperature Control
              </h3>
              <p className="text-xs sm:text-sm text-[#8A4A1C]/80 mt-2 leading-relaxed">
                Insulated thermal packaging with ice gel packs for sensitive medicines and fast metro delivery.
              </p>
            </div>
            <div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#8A4A1C] text-white text-xs sm:text-sm font-bold hover:bg-[#6e3914] transition shadow-sm"
              >
                <span>Order Essentials</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Light Blue Card */}
          <div className="bg-[#DCEBFA] rounded-[28px] p-8 xl:p-10 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition">
            <div>
              <span className="text-xs font-bold text-[#1C4D8A] uppercase tracking-wider">
                Pocket-Friendly Health
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#1C4D8A] mt-2 leading-snug">
                Save Up To 70% With Generic Substitutes
              </h3>
              <p className="text-xs sm:text-sm text-[#1C4D8A]/80 mt-2 leading-relaxed">
                Find high-quality bio-equivalent generic medicines sharing identical active therapeutic salts.
              </p>
            </div>
            <div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1C4D8A] text-white text-xs sm:text-sm font-bold hover:bg-[#143967] transition shadow-sm"
              >
                <span>Explore Generics</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>`
);
fs.writeFileSync('apps/web/src/app/page.tsx', page, 'utf8');
console.log('2. page.tsx updated');

// 3. faqs/page.tsx: remove diagnostics & doctors
let faqs = fs.readFileSync('apps/web/src/app/faqs/page.tsx', 'utf8');
faqs = faqs.replace(/\{\s*id:\s*"q7",[\s\S]*?\},/g, '');
faqs = faqs.replace(/\{\s*id:\s*"q8",[\s\S]*?\},/g, '');
faqs = faqs.replace(/, "Diagnostics & Doctors"/g, '');
fs.writeFileSync('apps/web/src/app/faqs/page.tsx', faqs, 'utf8');
console.log('3. faqs/page.tsx updated');

// 4. about/page.tsx: clean text
let about = fs.readFileSync('apps/web/src/app/about/page.tsx', 'utf8');
about = about.replace('vital health diagnostics, and top-tier doctor consultations accessible', 'wellness essentials, and daily healthcare necessities accessible');
about = about.replace('Every prescription order is audited by a registered Pharm.D', 'Every medicine order is audited by a registered Pharm.D');
fs.writeFileSync('apps/web/src/app/about/page.tsx', about, 'utf8');
console.log('4. about/page.tsx updated');

// 5. cart-store.ts
let cartStore = fs.readFileSync('apps/web/src/lib/cart-store.ts', 'utf8');
cartStore = cartStore.replace(/\s*prescriptionRequired:\s*boolean;/g, '');
cartStore = cartStore.replace(/\s*hasPrescriptionItems:\s*boolean;/g, '');
cartStore = cartStore.replace(/\s*hasPrescriptionItems:\s*false,/g, '');
cartStore = cartStore.replace(/\s*hasPrescriptionItems:\s*res\.data\.hasPrescriptionItems\s*\|\|\s*false,/g, '');
fs.writeFileSync('apps/web/src/lib/cart-store.ts', cartStore, 'utf8');
console.log('5. cart-store.ts updated');

// 6. CartDrawer.tsx
let cartDrawer = fs.readFileSync('apps/web/src/components/CartDrawer.tsx', 'utf8');
cartDrawer = cartDrawer.replace(/\s*hasPrescriptionItems,/g, '');
fs.writeFileSync('apps/web/src/components/CartDrawer.tsx', cartDrawer, 'utf8');
console.log('6. CartDrawer.tsx updated');

// 7. AuthModal.tsx
let authModal = fs.readFileSync('apps/web/src/components/AuthModal.tsx', 'utf8');
authModal = authModal.replace('Track orders, prescriptions & health records', 'Track orders & health essentials');
fs.writeFileSync('apps/web/src/components/AuthModal.tsx', authModal, 'utf8');
console.log('7. AuthModal.tsx updated');

// 8. apps/web/src/app/api/catalog/products/route.ts
let catRoute = fs.readFileSync('apps/web/src/app/api/catalog/products/route.ts', 'utf8');
catRoute = catRoute.replace(/\s*const prescriptionRequired = searchParams\.get\("prescriptionRequired"\);/g, '');
catRoute = catRoute.replace(/\s*if \(prescriptionRequired !== null[\s\S]*?queryParts\.push\(`prescriptionRequired=eq\.\$\{prescriptionRequired === "true"\}\`\);\s*\}/g, '');
catRoute = catRoute.replace(/\s*prescriptionRequired: p\.prescriptionRequired,/g, '');
catRoute = catRoute.replace(/\s*scheduleType: p\.scheduleType,/g, '');
fs.writeFileSync('apps/web/src/app/api/catalog/products/route.ts', catRoute, 'utf8');
console.log('8. products/route.ts updated');

// 9. autocomplete/route.ts
let autoRoute = fs.readFileSync('apps/web/src/app/api/catalog/search/autocomplete/route.ts', 'utf8');
autoRoute = autoRoute.replace(',prescriptionRequired', '');
fs.writeFileSync('apps/web/src/app/api/catalog/search/autocomplete/route.ts', autoRoute, 'utf8');
console.log('9. autocomplete/route.ts updated');

// 10. admin/inventory/page.tsx
let invPage = fs.readFileSync('apps/web/src/app/admin/inventory/page.tsx', 'utf8');
invPage = invPage.replace('; prescriptionRequired: boolean', '');
fs.writeFileSync('apps/web/src/app/admin/inventory/page.tsx', invPage, 'utf8');
console.log('10. inventory/page.tsx updated');

// 11. wishlist.controller.ts
let wishCtrl = fs.readFileSync('apps/api/src/modules/wishlist/wishlist.controller.ts', 'utf8');
wishCtrl = wishCtrl.replace(/\s*prescriptionRequired: p\.prescriptionRequired,/g, '');
wishCtrl = wishCtrl.replace(/\s*scheduleType: p\.scheduleType,/g, '');
fs.writeFileSync('apps/api/src/modules/wishlist/wishlist.controller.ts', wishCtrl, 'utf8');
console.log('11. wishlist.controller.ts updated');

// 12. redis-events.ts
let redEvents = fs.readFileSync('apps/api/src/lib/redis-events.ts', 'utf8');
redEvents = redEvents.replace(/\s*\|\s*"prescription\.uploaded"/g, '');
fs.writeFileSync('apps/api/src/lib/redis-events.ts', redEvents, 'utf8');
console.log('12. redis-events.ts updated');

// 13. apps/api/src/app.ts
let apiApp = fs.readFileSync('apps/api/src/app.ts', 'utf8');
apiApp = apiApp.replace(/\/\/ Static uploads[\s\S]*?app\.use\("\/uploads",[\s\S]*?\);\s*\}/g, '');
fs.writeFileSync('apps/api/src/app.ts', apiApp, 'utf8');
console.log('13. app.ts updated');
