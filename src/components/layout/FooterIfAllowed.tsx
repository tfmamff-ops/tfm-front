"use client";

import AppFooter from "./AppFooter";
import { usePathname } from "next/navigation";

/**
 * Renders the AppFooter except on auth-related routes like /signin.
 */
export default function FooterIfAllowed() {
  const pathname = usePathname();
  if (pathname === "/signin") return null;
  return <AppFooter />;
}
