import type { Metadata } from "next";
import { LogoMark } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Inloggen — Studio Prins",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Merkzijde */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 text-white"
        style={{
          background:
            "radial-gradient(120% 120% at 0% 0%, #2a28b0 0%, var(--ink) 60%)",
        }}
      >
        <LogoMark size={44} />
        <div>
          <h1
            className="text-4xl font-semibold leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Alles op één plek.
          </h1>
          <p className="mt-4 max-w-sm text-white/70 leading-relaxed">
            Klanten, projecten, facturen en leads — het interne dashboard van
            Studio Prins.
          </p>
        </div>
        <p className="text-sm text-white/50">
          © {new Date().getFullYear()} Studio Prins
        </p>
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
