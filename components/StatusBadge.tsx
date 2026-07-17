import { statusStyle, type StatusStyle } from "@/lib/status";

export function StatusBadge({
  map,
  status,
}: {
  map: Record<string, StatusStyle>;
  status: string;
}) {
  const s = statusStyle(map, status);
  return (
    <span className="badge" style={{ background: s.bg, color: s.fg }}>
      <span className="badge-dot" />
      {s.label}
    </span>
  );
}
