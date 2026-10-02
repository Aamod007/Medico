const fs = require('fs');

// 1. Update Next.js API route handlers to ensure Supabase key fallback
const fallbackKey = 'sb_publishable_r00XNR7sSTTpzUEk6_R69Q_0sJo3-ag';

const routeFiles = [
  'apps/web/src/app/api/catalog/categories/route.ts',
  'apps/web/src/app/api/catalog/products/route.ts',
  'apps/web/src/app/api/catalog/brands/route.ts',
  'apps/web/src/app/api/catalog/products/[slug]/route.ts',
  'apps/web/src/app/api/catalog/search/autocomplete/route.ts',
];

for (const file of routeFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      /const supabaseKey = process\.env\.SUPABASE_SECRET_KEY \|\| process\.env\.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \|\| ["'][^"']*["'];/g,
      `const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "${fallbackKey}";`
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated Supabase key fallback in ${file}`);
  }
}

// 2. Clean page.tsx: remove hardcoded defaults, purely fetch from Supabase
const pageFile = 'apps/web/src/app/page.tsx';
let pageContent = fs.readFileSync(pageFile, 'utf8');

// Remove DEFAULT_CATEGORIES, DEFAULT_FEATURED, DEFAULT_BRANDS
const startIdx = pageContent.indexOf('const DEFAULT_CATEGORIES = [');
const endIdx = pageContent.indexOf('export default function HomePage() {');

if (startIdx !== -1 && endIdx !== -1) {
  pageContent = pageContent.substring(0, startIdx) + pageContent.substring(endIdx);
  console.log('Removed hardcoded default catalog constants from page.tsx');
}

// Ensure state is empty and has loading indicator
pageContent = pageContent.replace(
  /const \[categories, setCategories\] = useState<any\[\]>\([^)]*\);/,
  'const [categories, setCategories] = useState<any[]>([]);'
);
pageContent = pageContent.replace(
  /const \[featuredProducts, setFeaturedProducts\] = useState<any\[\]>\([^)]*\);/,
  'const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);'
);
pageContent = pageContent.replace(
  /const \[bestSellers, setBestSellers\] = useState<any\[\]>\([^)]*\);/,
  'const [bestSellers, setBestSellers] = useState<any[]>([]);'
);
pageContent = pageContent.replace(
  /const \[brands, setBrands\] = useState<any\[\]>\([^)]*\);/,
  'const [brands, setBrands] = useState<any[]>([]);\n  const [loadingCatalog, setLoadingCatalog] = useState(true);'
);

// Update loadData
const oldLoadData = `  useEffect(() => {
    async function loadData() {
      const [catRes, prodRes, brandRes] = await Promise.all([
        api.get("/catalog/categories"),
        api.get("/catalog/products?limit=24"),
        api.get("/catalog/brands"),
      ]);

      if (catRes.success && catRes.data?.length) setCategories(catRes.data);
      if (brandRes.success && brandRes.data?.length) setBrands(brandRes.data);
      if (prodRes.success && prodRes.data?.length) {
        setFeaturedProducts(prodRes.data.slice(0, 12));
        setBestSellers(prodRes.data.slice(6, 18));
      }
    }
    loadData();
  }, []);`;

const newLoadData = `  useEffect(() => {
    async function loadData() {
      setLoadingCatalog(true);
      try {
        const [catRes, prodRes, brandRes] = await Promise.all([
          api.get("/catalog/categories"),
          api.get("/catalog/products?limit=24"),
          api.get("/catalog/brands"),
        ]);

        if (catRes.success && catRes.data) setCategories(catRes.data);
        if (brandRes.success && brandRes.data) setBrands(brandRes.data);
        if (prodRes.success && prodRes.data) {
          setFeaturedProducts(prodRes.data.slice(0, 12));
          setBestSellers(prodRes.data.slice(6, 18));
        }
      } catch (err) {
        console.error("Failed to load catalog from Supabase:", err);
      } finally {
        setLoadingCatalog(false);
      }
    }
    loadData();
  }, []);`;

pageContent = pageContent.replace(oldLoadData, newLoadData);

// Now in Category Grid, add loading skeleton if loading
const catGridTarget = `<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 xl:gap-6 2xl:gap-8">
          {categories.map((cat) => (`;

const catGridReplacement = `<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 xl:gap-6 2xl:gap-8">
          {loadingCatalog && categories.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2.5 p-3 animate-pulse">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-200" />
                <div className="w-16 h-3 bg-gray-200 rounded" />
              </div>
            ))
          ) : categories.map((cat) => (`;

if (pageContent.includes(catGridTarget)) {
  pageContent = pageContent.replace(catGridTarget, catGridReplacement);
  console.log('Added category loading skeleton');
}

// In Featured Products Grid, add loading skeleton if loading
const prodGridTarget = `<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
          {featuredProducts.slice(0, 12).map((p) => {`;

const prodGridReplacement = `<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
          {loadingCatalog && featuredProducts.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 animate-pulse">
                <div className="w-full h-36 bg-gray-100 rounded-xl" />
                <div className="w-3/4 h-4 bg-gray-200 rounded" />
                <div className="w-1/2 h-3 bg-gray-100 rounded" />
                <div className="w-1/3 h-5 bg-gray-200 rounded" />
              </div>
            ))
          ) : featuredProducts.slice(0, 12).map((p) => {`;

if (pageContent.includes(prodGridTarget)) {
  pageContent = pageContent.replace(prodGridTarget, prodGridReplacement);
  console.log('Added featured product loading skeleton');
}

fs.writeFileSync(pageFile, pageContent, 'utf8');
console.log('Successfully configured live Supabase fetching in page.tsx!');
