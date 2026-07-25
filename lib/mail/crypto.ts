import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM voor mailwachtwoorden. De sleutel staat in MAIL_SECRET
 * (64 hex-tekens = 32 bytes). Formaat van het versleutelde veld:
 *   "v1:<iv-base64>:<authtag-base64>:<ciphertext-base64>"
 *
 * Wachtwoorden worden alleen server-side versleuteld/ontsleuteld en gaan nooit
 * terug naar de client.
 */
function key(): Buffer {
  const hex = process.env.MAIL_SECRET;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "MAIL_SECRET ontbreekt of is ongeldig — verwacht 64 hex-tekens (32 bytes). " +
        "Genereer er één met: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, "hex");
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptSecret(enc: string): string {
  const parts = enc.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Onbekend geheimformaat voor mailwachtwoord.");
  }
  const [, iv, tag, ct] = parts;
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ct, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
