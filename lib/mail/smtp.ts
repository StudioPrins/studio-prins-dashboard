import "server-only";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { decryptSecret } from "./crypto";
import type { MailAccount } from "@/lib/db/schema";

/** SMTP-inloggegevens (wachtwoord in platte tekst). */
export interface SmtpAuth {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  username: string;
  password: string;
}

function smtpAuthFromAccount(account: MailAccount): SmtpAuth {
  return {
    smtpHost: account.smtpHost,
    smtpPort: account.smtpPort,
    smtpSecure: account.smtpSecure,
    username: account.username,
    password: decryptSecret(account.passwordEnc),
  };
}

function buildTransport(auth: SmtpAuth) {
  return nodemailer.createTransport({
    host: auth.smtpHost,
    port: auth.smtpPort,
    secure: auth.smtpSecure,
    auth: { user: auth.username, pass: auth.password },
  });
}

/** Test alleen de SMTP-kant: verbinden + authenticeren. */
export async function verifySmtp(
  auth: SmtpAuth
): Promise<{ ok: boolean; error?: string }> {
  try {
    await buildTransport(auth).verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** De velden van het oorspronkelijke bericht die we nodig hebben om te antwoorden. */
export interface ReplyTarget {
  fromAddress: string | null;
  subject: string | null;
  messageId: string | null;
  references: string | null;
}

function replySubject(subject: string | null): string {
  const s = (subject ?? "").trim();
  if (!s) return "Re:";
  return /^re:/i.test(s) ? s : `Re: ${s}`;
}

/**
 * Verstuurt een antwoord vanaf het account en geeft de exacte MIME-bytes terug,
 * zodat de aanroeper diezelfde bytes in de Verzonden-map kan APPENDen — de
 * kopie in Outlook is dan identiek aan wat de ontvanger kreeg.
 */
export async function sendReply(
  account: MailAccount,
  original: ReplyTarget,
  bodyText: string
): Promise<{ raw: Buffer }> {
  if (!original.fromAddress) {
    throw new Error("Oorspronkelijke afzender ontbreekt; kan niet antwoorden.");
  }

  const references = [original.references, original.messageId]
    .filter(Boolean)
    .join(" ")
    .trim();

  const mailOptions = {
    from: `"${account.naam}" <${account.email}>`,
    to: original.fromAddress,
    subject: replySubject(original.subject),
    text: bodyText,
    ...(original.messageId ? { inReplyTo: original.messageId } : {}),
    ...(references ? { references } : {}),
  };

  // Eén keer de MIME bouwen en zowel versturen als APPENDen met dezelfde bytes.
  const raw = await new MailComposer(mailOptions).compile().build();

  await buildTransport(smtpAuthFromAccount(account)).sendMail({
    envelope: { from: account.email, to: [original.fromAddress] },
    raw,
  });

  return { raw };
}
