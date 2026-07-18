"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { logoutAction } from "@/lib/actions/auth";

const NAV = [
  { href: "/", label: "Klanten", icon: ClientsIcon, exact: true },
  { href: "/facturen", label: "Facturen & offertes", icon: InvoiceIcon },
  { href: "/leads", label: "Leads", icon: LeadsIcon },
  { href: "/instellingen", label: "Bedrijfsgegevens", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col gap-1 h-full">
      <div className="px-3 py-5">
        <Logo />
      </div>

      <nav className="flex flex-col gap-0.5 px-3 mt-2">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors"
              style={
                active
                  ? { background: "var(--accent-soft)", color: "var(--accent-ink)" }
                  : { color: "var(--ink-soft)" }
              }
            >
              <Icon active={active} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <LogoutIcon />
            Uitloggen
          </button>
        </form>
      </div>
    </aside>
  );
}

/* --- iconen (inline SVG, geen externe assets) --- */
type IconProps = { active?: boolean };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function ClientsIcon(_: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3 2.9-4.6 5.5-4.6s4.9 1.6 5.5 4.6" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6M18 19c-.2-1.6-.9-2.9-2-3.8" />
    </svg>
  );
}
function InvoiceIcon(_: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <path d="M6 3h9l3 3v15l-2.2-1.3L13.6 22l-2.2-1.3L9.2 22 7 20.7 4 22V5" />
      <path d="M8 9h7M8 13h7" />
    </svg>
  );
}
function LeadsIcon(_: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <path d="M3 6.5 12 12l9-5.5" />
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 8l-4 4 4 4M6 12h11" />
    </svg>
  );
}
function SettingsIcon(_: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4" />
    </svg>
  );
}
