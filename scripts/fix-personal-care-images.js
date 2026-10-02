const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();

async function main() {
  const deadId = "photo-1608248597359-bb58331d248b";
  const replacementId = "photo-1556228720-195a672e8a03";

  console.log("Updating Category images...");
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    if (cat.image && cat.image.includes(deadId)) {
      const newUrl = cat.image.replace(deadId, replacementId);
      await prisma.category.update({
        where: { id: cat.id },
        data: { image: newUrl },
      });
      console.log(`Updated category: ${cat.name} -> ${newUrl}`);
    }
  }

  console.log("Updating Product images...");
  const products = await prisma.product.findMany();
  for (const p of products) {
    if (p.images && p.images.some(img => img && img.includes(deadId))) {
      const newImages = p.images.map(img => img.includes(deadId) ? img.replace(deadId, replacementId) : img);
      await prisma.product.update({
        where: { id: p.id },
        data: { images: newImages },
      });
      console.log(`Updated product: ${p.name}`);
    }
  }

  console.log("Image replacement complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
