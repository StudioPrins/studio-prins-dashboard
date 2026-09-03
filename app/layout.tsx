import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { DEMO } from "@/lib/demo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = DEMO
  ? {
      title: "Studio Prins — Dashboard (demo)",
      description:
        "Publieke demo met verzonnen data van het interne dashboard van Studio Prins.",
      // Een open demo hoort niet in de zoekresultaten; hij is bedoeld voor wie
      // de link krijgt, niet voor wie op de bedrijfsnaam zoekt.
      robots: { index: false, follow: false },
    }
  : {
      title: "Studio Prins — Dashboard",
      description: "Klanten, projecten, facturen en leads van Studio Prins.",
    };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
