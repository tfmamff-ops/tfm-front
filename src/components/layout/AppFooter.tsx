// src/components/layout/AppFooter.tsx
import Link from "next/link";

export default function AppFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto flex flex-col items-center gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:justify-between px-4">
        <p>
          © {new Date().getFullYear()} AGMCorp. Propiedad intelectual protegida.
        </p>
        <div className="flex items-center gap-4">
          <span>v0.1.0</span>
          <Link href="/" className="hover:text-foreground">
            About
          </Link>
          <Link href="/" className="hover:text-foreground">
            Docs
          </Link>
          <Link href="/" className="hover:text-foreground">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
