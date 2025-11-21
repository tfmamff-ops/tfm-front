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
  const instanceId = useAppStore((s) => s.instanceId);
  const reportLoading = useAppStore((s) => s.reportLoading);
  const reportUrl = useAppStore((s) => s.reportUrl);
  const reportError = useAppStore((s) => s.reportError);

  const setReportLoading = useAppStore((s) => s.setReportLoading);
  const setReportUrl = useAppStore((s) => s.setReportUrl);
  const setReportError = useAppStore((s) => s.setReportError);

  const [comment, setComment] = useState<string>("");
  const [hasDecided, setHasDecided] = useState(false);

  useEffect(() => {
    setComment("");
    setHasDecided(false);
  }, [instanceId]);

  if (!instanceId) {
    return null;
  }

  const handleGenerateReport = async (accepted: boolean) => {
    setHasDecided(true);
    setReportLoading(true);
    setReportError(undefined);

    try {
      const normalizedComment = comment.trim();
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceId,
          comment: normalizedComment || undefined,
          accepted,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Error al generar el reporte");
      }

      const data = await res.json();
      if (data.url) {
        setReportUrl(data.url);
      } else {
        throw new Error("No se recibió la URL del reporte");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setReportError(msg);
      // Allow retrying if it failed
      setHasDecided(false);
    } finally {
      setReportLoading(false);
    }
  };

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

  return (
    <div className="rounded-xl border border-green-100 bg-white/70 p-4 lg:col-span-2">
      <SectionHeader
        icon={<FileCog className="h-4 w-4 text-green-700" />}
        title="Revisión del resultado"
      />
      <Separator className="my-3" />
      <div className="flex flex-col gap-1">
        {!hasDecided && !reportUrl && (
          <div className="flex flex-col gap-3">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="Motivo u observaciones (opcional)"
              rows={4}
              maxLength={MAX_LENGTH}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {comment.length}/{MAX_LENGTH}
            </div>
            <div className="flex w-full flex-wrap gap-2">
              <Button
                type="button"
                variant="default"
                className="flex-1"
                onClick={() => handleGenerateReport(true)}
              >
                Aceptar resultado
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={() => handleGenerateReport(false)}
              >
                Rechazar resultado
              </Button>
            </div>
          </div>
        )}
        {reportLoading && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-700">
            <Loader2
              className="h-4 w-4 animate-spin text-emerald-500"
              aria-hidden="true"
            />
            <span>Generando reporte…</span>
          </div>
        )}
        {!reportLoading &&
          renderExternalLink(
            reportUrl,
            "Ver Reporte PDF",
            <FileText className="h-4 w-4" />
          )}

        {reportError && <p className="text-red-600 text-base">{reportError}</p>}
      </div>
    </div>
  );
}
