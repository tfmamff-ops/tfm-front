"use client";

import ResultCard from "../ResultCard";
import SelectedData from "../SelectedData";

export default function RightSidebar() {
  return (
    <aside className="lg:sticky lg:top-6 self-start col-span-12 lg:col-span-4 space-y-4">
      <SelectedData />
      <ResultCard />
    </aside>
  );
}
