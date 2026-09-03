import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
      // "server-only" gooit buiten een React-server-omgeving bij het importeren.
      // De modules die we testen zijn pure functies; de marker vervangen we hier
      // door een lege module in plaats van hem uit de broncode te halen.
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // Team en tarieven komen uit configuratie (zie lib/uren.ts). De tests krijgen
    // hier hun eigen verzonnen opgave, zodat ze niet afhangen van wat er toevallig
    // in de .env.local van de ontwikkelaar staat.
    env: {
      NEXT_PUBLIC_TEAM: "sijmen:Sijmen:sijmen@voorbeeld.nl;sam:Sam:sam@voorbeeld.nl",
      NEXT_PUBLIC_TARIEF_KLANT: "80",
      NEXT_PUBLIC_TARIEF_BEDRIJF: "50",
    },
  },
});
