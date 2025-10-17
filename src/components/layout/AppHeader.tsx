// src/components/layout/AppHeader.tsx
import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 min-w-0"
          aria-label="Inicio"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white text-xl font-bold">
            Rx
          </span>
          <div className="flex flex-col leading-tight min-w-0">
            {/* Responsive: móvil más chico, desktop grande */}
            <h1 className="text-sm md:text-lg font-extrabold text-green-600 tracking-tight truncate">
              Verificación Automática de Rotulado
            </h1>
            <span className="text-xs sm:text-sm text-muted-foreground truncate">
              Visión Artificial &amp; OCR
            </span>
          </div>
        </Link>

        {/* User capsule (placeholder) */}
        <div className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold">
            AL
          </span>
          <span className="text-sm sm:text-lg font-medium">Álvaro</span>
        </div>
      </div>
    </header>
  );
}
