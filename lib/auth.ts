import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE,
  signSession,
  verifySessionToken,
  type SessionPayload,
} from "./session";

/** Toegestane e-mailadressen (komma-gescheiden in AUTH_EMAILS, fallback AUTH_EMAIL). */
function allowedEmails(): string[] {
  const raw = process.env.AUTH_EMAILS || process.env.AUTH_EMAIL || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Controleert inloggegevens tegen de env-vars en zet bij succes de sessiecookie. */
export async function login(email: string, password: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const hash = process.env.AUTH_PASSWORD_HASH || "";

  const emailOk = allowedEmails().includes(normalized);
  const passwordOk = hash ? await bcrypt.compare(password, hash) : false;

  if (!emailOk || !passwordOk) return false;

  const token = await signSession(normalized);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dagen
  });
  return true;
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Huidige sessie of null. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Vereist een geldige sessie in server components én server actions.
 * Redirect naar /login als er geen is. Roep dit aan bij elke data-actie —
 * de proxy alleen is niet voldoende (zie AGENTS/Next.js data-security).
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
