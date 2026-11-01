import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: {
    // Migrations should use Neon's direct (non-pooled) URL when provided; the app itself uses the pooled DATABASE_URL.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
