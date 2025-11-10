import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import HydrationGate from "@/components/HydrationGate";
import AppSkeleton from "@/components/AppSkeleton";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import AuthBootstrap from "@/components/AuthBootstrap";
import AuthSessionProvider from "@/components/AuthSessionProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rotulado",
  description: "Verificación Automática de Rotulado",
  icons: { icon: "/favicon.ico" },
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col bg-background text-foreground`}
      >
        {/* Background */}
        <div
          aria-hidden
          className="fixed inset-0 -z-20 bg-[#e8f5f0] dark:bg-[#0a1a14]"
        />

        {/* Header (client inside) */}
        <AppHeader />

        {/* Content (client components inside) */}
        <HydrationGate fallback={<AppSkeleton />}>
          <AuthSessionProvider>
            {/* Initialize a temporary requestContext while login is pending */}
            <AuthBootstrap />
            <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-6">
              <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-lg shadow-emerald-900/5 p-4 sm:p-6 lg:p-8 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
                {children}
              </div>
            </main>
          </AuthSessionProvider>
        </HydrationGate>

        <AppFooter />
      </body>
    </html>
  );
}
