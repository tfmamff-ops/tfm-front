"use client";

import { useState } from "react";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import { Button } from "@/components/ui/button"; // o reemplazá por <button>

export default function Page() {
  const [view, setView] = useState<"left" | "right">("left");

  return (
    <main className="container mx-auto p-4 space-y-4">
      <div className="flex gap-2">
        <Button
          variant={view === "left" ? "default" : "outline"}
          onClick={() => setView("left")}
        >
          Ver izquierda
        </Button>
        <Button
          variant={view === "right" ? "default" : "outline"}
          onClick={() => setView("right")}
        >
          Ir a derecha
        </Button>
      </div>

      {view === "left" ? (
        <section className="space-y-6">
          <LeftSidebar />
        </section>
      ) : (
        <section className="space-y-6">
          <RightSidebar />
        </section>
      )}
    </main>
  );
}
