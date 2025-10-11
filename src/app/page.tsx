"use client";
import LeftSidebar from "@/components/layout/LeftSidebar";
import OcrResultCard from "@/components/OcrResultCard";
import Preview from "@/components/Preview";
import SelectedData from "@/components/SelectedData";
import StatusSummary from "@/components/StatusSummary";
import SendToAzureButton from "@/components/uploader/SendToAzureButton";

export default function Page() {
  return (
    <main className="grid grid-cols-12 gap-6">
      <section className="col-span-12 lg:col-span-4 space-y-6">
        <LeftSidebar />
      </section>

      <section className="col-span-12 lg:col-span-5 space-y-4">
        <SelectedData />
        <Preview />
        <SendToAzureButton />
      </section>

      <section className="col-span-12 lg:col-span-3 space-y-6">
        <StatusSummary />
        <OcrResultCard />
      </section>
    </main>
  );
}
