import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const paracip = await prisma.product.findFirst({
    where: { name: { contains: "Paracip" } },
  });
  console.log("Paracip:", paracip ? { name: paracip.name, slug: paracip.slug } : null);
}

main().finally(() => prisma.$disconnect());
