import type { Metadata } from "next";
import { LogoMark } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Inloggen — Studio Prins",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Merkzijde. Bewust een getekend vlak in plaats van een foto: de repo is
          openbaar en een teamfoto hoort daar niet in. */}
      <div
        className="hidden lg:block relative overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(155deg, var(--accent-ink) 0%, var(--accent) 55%, #5b58ea 100%)",
        }}
      >
        {/* Twee zachte lichtvlekken geven het vlak diepte zonder beeldmateriaal. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 45% at 20% 12%, rgba(255,255,255,0.22) 0%, transparent 70%), " +
              "radial-gradient(50% 40% at 85% 78%, rgba(255,255,255,0.14) 0%, transparent 72%)",
          }}
        />
        {/* Fijn rasterpatroon, verwijst naar de kaartenrasters in het dashboard. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), " +
              "linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(80% 60% at 50% 40%, black 0%, transparent 100%)",
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <LogoMark size={44} />
          <div>
            <h1
              className="text-4xl font-semibold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Alles op één plek
            </h1>
            <p className="mt-4 max-w-md text-white/80 leading-relaxed">
              Klanten en hun onboarding, geregistreerde uren, facturen en
              offertes, en een mailassistent die de inbox sorteert en
              conceptantwoorden schrijft.
            </p>
          </div>
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} Studio Prins
          </p>
        </div>
      </div>

      {/* Formulierzijde */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <LogoMark size={40} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Welkom terug</h2>
          <p className="mt-1.5 text-sm text-muted">
            Log in om verder te gaan naar je dashboard.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
