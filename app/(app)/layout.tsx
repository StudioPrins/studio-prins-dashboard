import { requireSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { DemoBanner } from "@/components/DemoBanner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Beveiliging op laag niveau: naast de proxy checken we hier ook de sessie.
  await requireSession();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <div className="hidden lg:block border-r border-line bg-surface">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>
      <div className="min-w-0">
        <DemoBanner />
        <MobileNav />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
