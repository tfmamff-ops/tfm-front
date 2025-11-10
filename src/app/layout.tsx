import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import HydrationGate from "@/components/HydrationGate";
import AppSkeleton from "@/components/AppSkeleton";
import HeaderIfAllowed from "@/components/layout/HeaderIfAllowed";
import AppFooter from "@/components/layout/AppFooter";
import AuthBootstrap from "@/components/AuthBootstrap";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import MainContainer from "@/components/layout/MainContainer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rotulado",
  description: "Verificación Automática de Rotulado",
  icons: { icon: "/favicon.ico" },
};

// Next.js 15: themeColor must live in a separate viewport export instead of metadata
export const viewport = {
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

        {/* Header hidden on /signin */}
        <HeaderIfAllowed />

        {/* Content (client components inside) */}
        <HydrationGate fallback={<AppSkeleton />}>
          <AuthSessionProvider>
            {/* Initialize a temporary requestContext while login is pending */}
            <AuthBootstrap />
            <MainContainer>{children}</MainContainer>
          </AuthSessionProvider>
        </HydrationGate>

        <AppFooter />
      </body>
    </html>
  );
}
