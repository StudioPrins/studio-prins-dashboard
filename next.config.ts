import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deze Node-packages gebruiken native modules / dynamische requires en mogen
  // niet door de Server Components-bundler heen (anders faalt de build/runtime).
  serverExternalPackages: ["imapflow", "mailparser", "nodemailer"],
};

export default nextConfig;
