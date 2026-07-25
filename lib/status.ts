export type StatusStyle = { label: string; bg: string; fg: string };

/** Klantstatussen */
export const CLIENT_STATUSES: Record<string, StatusStyle> = {
  onboarding: { label: "Onboarding", bg: "var(--info-soft)", fg: "var(--info)" },
  actief: { label: "Actief", bg: "var(--success-soft)", fg: "var(--success)" },
  onderhoud: { label: "Onderhoud", bg: "var(--accent-soft)", fg: "var(--accent-ink)" },
  gearchiveerd: { label: "Gearchiveerd", bg: "var(--surface-2)", fg: "var(--muted)" },
};

export const CLIENT_STATUS_KEYS = Object.keys(CLIENT_STATUSES);

/** Factuur-/offertestatussen */
export const INVOICE_STATUSES: Record<string, StatusStyle> = {
  concept: { label: "Concept", bg: "var(--surface-2)", fg: "var(--muted)" },
  verzonden: { label: "Verzonden", bg: "var(--info-soft)", fg: "var(--info)" },
  betaald: { label: "Betaald", bg: "var(--success-soft)", fg: "var(--success)" },
  verlopen: { label: "Verlopen", bg: "var(--danger-soft)", fg: "var(--danger)" },
};

export const INVOICE_STATUS_KEYS = Object.keys(INVOICE_STATUSES);

/** Leadstatussen */
export const LEAD_STATUSES: Record<string, StatusStyle> = {
  nieuw: { label: "Nieuw", bg: "var(--surface-2)", fg: "var(--ink-soft)" },
  "demo-klaar": { label: "Demo klaar", bg: "var(--accent-soft)", fg: "var(--accent-ink)" },
  gemaild: { label: "Gemaild", bg: "var(--info-soft)", fg: "var(--info)" },
  gebeld: { label: "Gebeld", bg: "var(--amber-soft)", fg: "var(--amber)" },
  deal: { label: "Deal!", bg: "var(--success-soft)", fg: "var(--success)" },
  afgewezen: { label: "Afgewezen", bg: "var(--danger-soft)", fg: "var(--danger)" },
};

export const LEAD_STATUS_KEYS = Object.keys(LEAD_STATUSES);

/** Mailcategorieën (AI-gestuurd). */
export const MAIL_CATEGORY_STYLES: Record<string, StatusStyle> = {
  belangrijk: { label: "Belangrijk", bg: "var(--danger-soft)", fg: "var(--danger)" },
  beantwoorden: { label: "Beantwoorden", bg: "var(--accent-soft)", fg: "var(--accent-ink)" },
  nieuwsbrief: { label: "Nieuwsbrief", bg: "var(--info-soft)", fg: "var(--info)" },
  notificatie: { label: "Notificatie", bg: "var(--amber-soft)", fg: "var(--amber)" },
  onbelangrijk: { label: "Onbelangrijk", bg: "var(--surface-2)", fg: "var(--muted)" },
};

export function statusStyle(
  map: Record<string, StatusStyle>,
  key: string
): StatusStyle {
  return map[key] ?? { label: key, bg: "var(--surface-2)", fg: "var(--muted)" };
}
