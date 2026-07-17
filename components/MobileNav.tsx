"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { logoutAction } from "@/lib/actions/auth";

const NAV = [
  { href: "/", label: "Klanten", exact: true },
  { href: "/facturen", label: "Facturen" },
  { href: "/leads", label: "Leads" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <header className="lg:hidden sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 h-14">
        <LogoMark size={30} />
        <form action={logoutAction}>
          <button className="text-sm font-medium text-muted">Uitloggen</button>
        </form>
      </div>
      <nav className="flex gap-1 px-3 pb-2 overflow-x-auto">
        {NAV.map(({ href, label, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap"
              style={
                active
                  ? { background: "var(--accent-soft)", color: "var(--accent-ink)" }
                  : { color: "var(--ink-soft)" }
              }
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
