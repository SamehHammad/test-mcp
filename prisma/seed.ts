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

  // Ceramic catalogue
  const ceramicCats = await Promise.all(
    [
      ['Ceramic Tiles', 'ceramic-tiles'],
      ['Porcelain', 'porcelain'],
      ['Mosaic', 'mosaic'],
      ['Sunbreaks', 'sunbreaks'],
      ['Tile Accessories', 'tile-accessories'],
    ].map(([name, slug]) => db.category.upsert({ where: { slug }, update: {}, create: { name, slug } })),
  );
  const [tiles, porcelain, mosaic, sunbreaks, accessories] = ceramicCats;
  const ceramic = [
    ['Classic Sunbreak', 'classic-sunbreak', 8500, 60, 'ACTIVE', sunbreaks.id, 'Ceramic sunbreak panel in a classic Mediterranean pattern.'],
    ['Glossy White Wall Tile 30x60', 'glossy-white-wall-tile-30x60', 4200, 400, 'ACTIVE', tiles.id, 'Glossy white ceramic wall tile, 30x60 cm.'],
    ['Matte Grey Floor Tile 60x60', 'matte-grey-floor-tile-60x60', 6800, 250, 'ACTIVE', tiles.id, 'Matte grey ceramic floor tile, 60x60 cm.'],
    ['Marble Look Porcelain 80x80', 'marble-look-porcelain-80x80', 14500, 120, 'ACTIVE', porcelain.id, 'Polished marble-look porcelain slab, 80x80 cm.'],
    ['Wood Effect Porcelain Plank', 'wood-effect-porcelain-plank', 9800, 180, 'ACTIVE', porcelain.id, 'Wood-effect porcelain plank, 20x120 cm.'],
    ['Glass Mosaic Blue Mix', 'glass-mosaic-blue-mix', 7600, 90, 'ACTIVE', mosaic.id, 'Blue mixed glass mosaic sheet, 30x30 cm.'],
    ['Hexagon Ceramic Mosaic', 'hexagon-ceramic-mosaic', 6400, 75, 'ACTIVE', mosaic.id, 'Hexagon ceramic mosaic sheet in matte finish.'],
    ['Tile Adhesive 25kg', 'tile-adhesive-25kg', 3200, 300, 'ACTIVE', accessories.id, 'Cement-based tile adhesive, 25 kg bag.'],
    ['Epoxy Grout 2kg', 'epoxy-grout-2kg', 5400, 0, 'DRAFT', accessories.id, 'Two-part epoxy grout for tiles, 2 kg.'],
    ['Aluminium Tile Trim', 'aluminium-tile-trim', 1800, 500, 'ACTIVE', accessories.id, 'Aluminium edge trim for tiles, 2.5 m.'],
  ] as const;
  for (const [name, slug, priceCents, stock, status, categoryId, description] of ceramic) {
    await db.product.upsert({
      where: { slug },
      update: {},
      create: { name, slug, priceCents, stock, status, categoryId, description, currency: 'SAR' },
    });
  }
  console.log('seeded', ceramic.length, 'ceramic products');
  console.log("seeded", cats.length, "categories,", products.length, "products");
}

main().finally(() => db.$disconnect());
