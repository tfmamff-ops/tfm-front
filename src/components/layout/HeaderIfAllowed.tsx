"use client";

import AppHeader from "./AppHeader";
import { usePathname } from "next/navigation";

/**
 * Renders the AppHeader except on auth-related routes like /signin.
 */
export default function HeaderIfAllowed() {
  const pathname = usePathname();
  if (pathname === "/signin") return null;
  return <AppHeader />;
}
