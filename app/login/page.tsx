import type { Metadata } from "next";
import Image from "next/image";
import { LogoMark } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Inloggen — Studio Prins",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Merkzijde met teamfoto */}
      <div className="hidden lg:block relative overflow-hidden text-white">
        <Image
          src="/deboys-studioprins.jpeg"
          alt="Het team van Studio Prins"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        {/* Donkere overlay voor leesbaarheid van de tekst */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(23,22,27,0.35) 0%, rgba(23,22,27,0.55) 45%, rgba(23,22,27,0.88) 100%)",
          }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <LogoMark size={44} />
          <div>
            <h1
              className="text-4xl font-semibold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ewa, eigenaar van het fantastische bedrijf Studioprins
            </h1>
            <p className="mt-4 max-w-md text-white/80 leading-relaxed">
              Binnen dit dashboard beheren we onze leads en klanten. We houden
              per klant een checklist bij en kunnen eenvoudig facturen opmaken.
              We gaan veeeeel pap maken.
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
