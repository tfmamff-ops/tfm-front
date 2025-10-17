"use client";
import LeftSidebar from "@/components/layout/LeftSidebar";
import Preview from "@/components/Preview";
import SendToAzureButton from "@/components/uploader/SendToAzureButton";
import RightSidebar from "@/components/layout/RightSidebar";

export default function Page() {
  return (
    <main className="grid grid-cols-12 gap-6">
      <section className="col-span-12 lg:col-span-6 space-y-6">
        <LeftSidebar />
      </section>

      <section className="col-span-12 lg:col-span-6 space-y-6">
        <Preview />
        <SendToAzureButton />
        <RightSidebar />
      </section>
    </main>
  );
}
