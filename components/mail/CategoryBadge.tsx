import { MAIL_CATEGORY_STYLES, statusStyle } from "@/lib/status";

export function CategoryBadge({ category }: { category: string | null }) {
  const s = category
    ? statusStyle(MAIL_CATEGORY_STYLES, category)
    : { label: "…", bg: "var(--surface-2)", fg: "var(--muted)" };
  return (
    <span className="badge" style={{ background: s.bg, color: s.fg }}>
      <span className="badge-dot" />
      {category ? s.label : "Bezig…"}
    </span>
  );
}
