import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const cats = await Promise.all(
    [
      ["Electronics", "electronics"],
      ["Home", "home"],
      ["Apparel", "apparel"],
    ].map(([name, slug]) =>
      db.category.upsert({ where: { slug }, update: {}, create: { name, slug } }),
    ),
  );
  const [electronics, home, apparel] = cats;
  const products = [
    ["Wireless Headphones", "wireless-headphones", 12999, 40, "ACTIVE", electronics.id],
    ["Mechanical Keyboard", "mechanical-keyboard", 8900, 25, "ACTIVE", electronics.id],
    ["USB-C Hub", "usb-c-hub", 4500, 0, "DRAFT", electronics.id],
    ["Ceramic Mug", "ceramic-mug", 1400, 120, "ACTIVE", home.id],
    ["Desk Lamp", "desk-lamp", 3600, 18, "ACTIVE", home.id],
    ["Linen Throw", "linen-throw", 6200, 9, "ARCHIVED", home.id],
    ["Cotton T-Shirt", "cotton-t-shirt", 2200, 75, "ACTIVE", apparel.id],
    ["Rain Jacket", "rain-jacket", 9900, 12, "DRAFT", apparel.id],
  ] as const;
  for (const [name, slug, priceCents, stock, status, categoryId] of products) {
    await db.product.upsert({
      where: { slug },
      update: {},
      create: { name, slug, priceCents, stock, status, categoryId, description: `${name} - sample product.` },
    });
  }
  console.log("seeded", cats.length, "categories,", products.length, "products");
}

main().finally(() => db.$disconnect());
