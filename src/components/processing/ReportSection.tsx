"use client";

import SectionHeader from "@/components/processing/SectionHeader";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import {
  ExternalLink,
  FileCog,
  FileText,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

const MAX_LENGTH = 300;

export default function ReportSection() {
  //   const reportError = useAppStore((s) => s.reportError);
  //   const reportLoading = useAppStore((s) => s.reportLoading);
  //     const reportUrl = useAppStore((s) => s.reportUrl);

  const [reportStarted, setReportStarted] = useState<boolean>(false);
  const [comment, setComment] = useState<string>("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [reportUrl, setReportUrl] = useState<string>("");

  const renderExternalLink = (
    href?: string,
    label: ReactNode = "Reporte",
    icon: React.ReactNode = <ImageIcon className="h-4 w-4" />
  ) => (
    <>
      {href ? (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm text-green-600 underline hover:text-green-700"
        >
          {icon}
          {label}
          <ExternalLink className="h-3 w-3 opacity-70 ml-1" />
        </Link>
      ) : null}
    </>
  );

  useEffect(() => {
    if (reportLoading) {
      // Simulate report generation delay
      const timer = setTimeout(() => {
        setReportLoading(false);
        setReportUrl("abcdefg.pdf");
      }, 5000);

      return () => clearTimeout(timer);
    }

    if (reportUrl) {
      const timer2 = setTimeout(() => {
        setReportLoading(false);
        setReportStarted(false);
        setReportUrl("");
      }, 5000);

      return () => clearTimeout(timer2);
    }
  }, [reportLoading, reportStarted, reportUrl]);

  return (
    <div className="rounded-xl border border-green-100 bg-white/70 p-4 lg:col-span-2">
      <SectionHeader
        icon={<FileCog className="h-4 w-4 text-green-700" />}
        title="Revisión del resultado"
      />
      <Separator className="my-3" />
      <div className="flex flex-col gap-1">
        {!reportStarted && (
          <div className="flex flex-col gap-3">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Motivo u observaciones (opcional)"
              rows={4}
              maxLength={MAX_LENGTH}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {comment.length}/{MAX_LENGTH}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  setReportStarted(true);
                  setReportLoading(true);
                }}
              >
                Aceptar resultado
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setReportStarted(true);
                  setReportLoading(true);
                }}
              >
                Rechazar resultado
              </Button>
            </div>
          </div>
        )}
        {!reportError &&
          !reportLoading &&
          renderExternalLink(
            reportUrl,
            "PDF",
            <FileText className="h-4 w-4" />
          )}
        {reportLoading && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <Loader2
              className="h-4 w-4 animate-spin text-emerald-500"
              aria-hidden="true"
            />
            <span>Generando reporte…</span>
          </div>
        )}
        {reportError && <p className="text-red-600 text-base">{reportError}</p>}
      </div>
    </div>
  );
}
