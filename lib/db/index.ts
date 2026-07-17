import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

type DB = ReturnType<typeof create>;

function create() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL ontbreekt. Zet deze in .env.local (lokaal) of in de Vercel-omgevingsvariabelen."
    );
  }
  return drizzle(neon(connectionString), { schema });
}

// Lazy: de verbinding wordt pas gemaakt bij het eerste gebruik, zodat een
// build zonder DATABASE_URL niet faalt bij het importeren.
let cached: DB | null = null;
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    if (!cached) cached = create();
    const value = cached[prop as keyof DB];
    return typeof value === "function" ? value.bind(cached) : value;
  },
});

export * from "./schema";
