const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

const oldUrl = 'photo-1550572017-edd951aa8f72';
const newUrl = 'photo-1516627145497-ae6968895b74';

async function main() {
  console.log('Fixing broken Unsplash image references in Supabase database...');

  // 1. Update Categories
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    if (cat.image && cat.image.includes(oldUrl)) {
      const fixedImage = cat.image.replace(oldUrl, newUrl);
      await prisma.category.update({
        where: { id: cat.id },
        data: { image: fixedImage },
      });
      console.log(`Updated Category "${cat.name}" image to working Unsplash URL`);
    }
  }

  // 2. Update Products
  const products = await prisma.product.findMany();
  let updatedProdCount = 0;
  for (const prod of products) {
    if (prod.images && prod.images.some((img) => img.includes(oldUrl))) {
      const fixedImages = prod.images.map((img) => img.replace(oldUrl, newUrl));
      await prisma.product.update({
        where: { id: prod.id },
        data: { images: fixedImages },
      });
      updatedProdCount++;
    }
  }
  console.log(`Updated ${updatedProdCount} Products having broken image URLs in Supabase database`);

  // 3. Update seed.ts for consistency
  const seedFile = 'apps/api/prisma/seed.ts';
  if (fs.existsSync(seedFile)) {
    let content = fs.readFileSync(seedFile, 'utf8');
    content = content.replaceAll(oldUrl, newUrl);
    fs.writeFileSync(seedFile, content, 'utf8');
    console.log(`Updated ${seedFile}`);
  }

  await prisma.$disconnect();
  console.log('Done fixing broken images!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
