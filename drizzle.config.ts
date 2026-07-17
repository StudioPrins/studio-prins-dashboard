import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js gebruikt .env.local; laad die (met .env als fallback) voor drizzle-kit.
config({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
