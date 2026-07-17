import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "sp_session";
const ALG = "HS256";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET ontbreekt in de omgevingsvariabelen.");
  return new TextEncoder().encode(s);
}

export type SessionPayload = { email: string };

/** Maakt een ondertekend sessie-token (JWT), 7 dagen geldig. */
export async function signSession(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

/** Verifieert een token. Geeft de payload terug, of null bij ongeldig/verlopen. */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.email === "string") return { email: payload.email };
    return null;
  } catch {
    return null;
  }
}
