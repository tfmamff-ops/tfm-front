import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import HydrationGate from "@/components/HydrationGate";
import AppSkeleton from "@/components/AppSkeleton";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TFM Rotulado",
  description: "Verificación Automática de Rotulado",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col bg-background text-foreground`}
      >
        {/* Global header */}
        <AppHeader />

        {/* Page content (hydrate-gated) */}
        <HydrationGate fallback={<AppSkeleton />}>
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </HydrationGate>

        {/* Global footer */}
        <AppFooter />
      </body>
    </html>
  );
}
