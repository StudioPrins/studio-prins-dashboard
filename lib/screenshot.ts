/**
 * Bouwt een screenshot-URL voor een klantwebsite via thum.io (gratis hotlink,
 * geen opslag nodig). Een handmatige override gaat altijd voor.
 */
export function screenshotUrl(
  websiteUrl: string | null | undefined,
  override?: string | null,
  width = 800
): string | null {
  if (override) return override;
  if (!websiteUrl) return null;
  const clean = websiteUrl.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!clean) return null;
  return `https://image.thum.io/get/width/${width}/https://${clean}`;
}

/** Normaliseert een URL voor gebruik in een href (voegt https toe indien nodig). */
export function toHref(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
