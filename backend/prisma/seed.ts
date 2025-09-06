import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const names = ["Electronics", "Furniture", "Books", "Clothing", "Sports"];
  for (const name of names) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .then(() => console.log("Seeded categories"))
  .finally(() => prisma.$disconnect());
