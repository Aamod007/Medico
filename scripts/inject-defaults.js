const fs = require('fs');
const file = 'apps/web/src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const needle = 'export default function HomePage() {';
const replacement = `const DEFAULT_CATEGORIES = [
  {
    id: "a4c9f59c-212c-4d19-9d28-2ea4121f7c84",
    name: "Everyday Essentials",
    slug: "everyday-essentials",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300",
  },
  {
    id: "156f4fa2-af4b-48ea-b3b4-f7403181503d",
    name: "Vitamins & Supplements",
    slug: "vitamins-and-supplements",
    image: "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=300",
  },
  {
    id: "22c0b827-c368-40a1-aae3-7f8d181da36d",
    name: "First Aid & Trauma Care",
    slug: "first-aid",
    image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=300",
  },
  {
    id: "fb965f33-4c65-4e99-9123-be9a836ba373",
    name: "Personal Care",
    slug: "personal-care",
    image: "https://images.unsplash.com/photo-1608248597359-bb58331d248b?w=300",
  },
  {
    id: "ba4620cb-62b0-46da-9b85-02ea3439cbd0",
    name: "Women's Health",
    slug: "womens-health",
    image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300",
  },
  {
    id: "b3b0aa98-2e3b-416e-acbb-f673bc055b9d",
    name: "Baby Care",
    slug: "baby-care",
    image: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=300",
  },
  {
    id: "ac768a3b-f86b-4140-9597-72eb305ea6d6",
    name: "Diabetes Care",
    slug: "diabetes-care",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300",
  },
  {
    id: "27e3063d-e262-4756-a85a-adecac097a96",
    name: "Digestive & Gut Health",
    slug: "digestive-gut-health",
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300",
  },
];

const DEFAULT_FEATURED = [
  {
    id: "3364c61f-7162-4e50-b0f1-b71b087af88c",
    name: "Augmentin 625 Duo Antibiotic Tablets",
    slug: "augmentin-625-duo-tablets",
    images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"],
    brand: { name: "GSK" },
    category: { name: "Antibiotics" },
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 34,
    defaultVariant: { price: 204, mrp: 240, packSize: "Strip of 10 Tablets" },
  },
  {
    id: "056c768d-4283-42fc-8775-61dca031ef0d",
    name: "Enterogermina 2 Billion Spores Suspension",
    slug: "enterogermina-2-billion-spores",
    images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"],
    brand: { name: "Sanofi" },
    category: { name: "Digestive & Gut Health" },
    isBestSeller: false,
    rating: 4.9,
    reviewCount: 28,
    defaultVariant: { price: 475, mrp: 550, packSize: "Box of 10 Mini Bottles" },
  },
  {
    id: "8e26e79e-5442-4d48-b845-4135235a7dcb",
    name: "Pan-D Gastro-Resistant Capsules",
    slug: "pan-d-capsules",
    images: ["https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600"],
    brand: { name: "Alkem" },
    category: { name: "Gastro & Antacids" },
    isBestSeller: true,
    rating: 4.7,
    reviewCount: 52,
    defaultVariant: { price: 195, mrp: 230, packSize: "Strip of 15 Capsules" },
  },
  {
    id: "b5e1ef1d-d25c-4c5f-acdf-e5c977228195",
    name: "Gelusil Antacid Liquid (Mint Flavor)",
    slug: "gelusil-antacid-liquid-mint",
    images: ["https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600"],
    brand: { name: "Pfizer" },
    category: { name: "Gastro & Antacids" },
    isBestSeller: false,
    rating: 4.6,
    reviewCount: 41,
    defaultVariant: { price: 115, mrp: 135, packSize: "Bottle of 200ml" },
  },
  {
    id: "afa90615-b702-4a87-81fc-e78c788d39e8",
    name: "Sugar-Free Gold Low Calorie Sweetener",
    slug: "sugar-free-gold-pellets-500",
    images: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600"],
    brand: { name: "Zydus Wellness" },
    category: { name: "Diabetes Care" },
    isBestSeller: false,
    rating: 4.5,
    reviewCount: 19,
    defaultVariant: { price: 245, mrp: 280, packSize: "Pack of 500 Pellets" },
  },
  {
    id: "e8c20c1f-575a-40af-ae5d-2d7682b40f6c",
    name: "Accu-Chek Active Blood Glucose Strips",
    slug: "accu-chek-active-test-strips-50",
    images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"],
    brand: { name: "Roche" },
    category: { name: "Diabetes Care" },
    isBestSeller: true,
    rating: 4.9,
    reviewCount: 88,
    defaultVariant: { price: 875, mrp: 999, packSize: "Box of 50 Strips" },
  },
];

const DEFAULT_BRANDS = [
  { id: "b1", name: "Cipla", slug: "cipla" },
  { id: "b2", name: "Sun Pharma", slug: "sun-pharma" },
  { id: "b3", name: "Dr. Reddy's", slug: "dr-reddys" },
  { id: "b4", name: "Abbott", slug: "abbott" },
  { id: "b5", name: "GSK", slug: "gsk" },
  { id: "b6", name: "Alkem", slug: "alkem" },
];

export default function HomePage() {`;

content = content.replace(needle, replacement);
content = content.replace('const [categories, setCategories] = useState<any[]>([]);', 'const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);');
content = content.replace('const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);', 'const [featuredProducts, setFeaturedProducts] = useState<any[]>(DEFAULT_FEATURED);');
content = content.replace('const [bestSellers, setBestSellers] = useState<any[]>([]);', 'const [bestSellers, setBestSellers] = useState<any[]>(DEFAULT_FEATURED);');
content = content.replace('const [brands, setBrands] = useState<any[]>([]);', 'const [brands, setBrands] = useState<any[]>(DEFAULT_BRANDS);');

content = content.replace('if (catRes.success) setCategories(catRes.data || []);', 'if (catRes.success && catRes.data?.length) setCategories(catRes.data);');
content = content.replace('if (brandRes.success) setBrands(brandRes.data || []);', 'if (brandRes.success && brandRes.data?.length) setBrands(brandRes.data);');
content = content.replace('if (prodRes.success && prodRes.data) {', 'if (prodRes.success && prodRes.data?.length) {');

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated page.tsx with default catalog data!');
