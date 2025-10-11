"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, FileDown, FileText } from "lucide-react";

/** Datos que devuelve tu mock / API */
type ApiHistoryItem = {
  id: string;
  unit: string;
  lot: string;
  expiration: string;
  datamatrix: boolean;
  erp: boolean;
  result: string; // "OK" | "ERROR" | otros textos
  createdAt: string; // ISO
};

const LOADING_ROW_KEYS = ["row-a", "row-b", "row-c", "row-d", "row-e"] as const;

export default function HistoryTable() {
  const router = useRouter();

  const [rows, setRows] = useState<readonly ApiHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetch("http://localhost:4000/history")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: ApiHistoryItem[]) => {
        if (!alive) return;
        const sorted = [...json].sort((a, b) =>
          (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
        );
        setRows(sorted);
        setErr(null);
      })
      .catch((e: unknown) => {
        const msg =
          typeof e === "object" &&
          e &&
          "message" in (e as Record<string, unknown>)
            ? String((e as { message?: unknown }).message)
            : String(e);
        setErr(msg);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (err) {
    return (
      <div className="text-sm text-rose-600 dark:text-rose-400">
        Failed to load history: {err}
      </div>
    );
  }

  if (rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No records yet.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Recent history</h2>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <a href="/api/export-csv" target="_blank" rel="noreferrer">
              <FileDown className="mr-2 h-4 w-4" />
              Export CSV
            </a>
          </Button>
          <Button asChild size="sm" variant="default">
            <a href="/api/generate-report" target="_blank" rel="noreferrer">
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </a>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Time</TableHead>
              <TableHead className="min-w-[140px]">Unit</TableHead>
              <TableHead className="min-w-[120px]">Batch</TableHead>
              <TableHead className="min-w-[120px]">Expiry</TableHead>
              <TableHead className="w-[110px] text-center">
                DataMatrix
              </TableHead>
              <TableHead className="w-[80px] text-center">ERP</TableHead>
              <TableHead className="w-[100px]">Result</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((r) => {
              const datamatrixIcon = r.datamatrix ? (
                <Check className="inline h-4 w-4" />
              ) : (
                <X className="inline h-4 w-4" />
              );

              const erpIcon = r.erp ? (
                <Check className="inline h-4 w-4" />
              ) : (
                <X className="inline h-4 w-4" />
              );

              const resultLabel =
                (r.result ?? "").toString().toUpperCase() || "—";

              let resultBadge: ReactNode;
              if (resultLabel === "OK") {
                resultBadge = (
                  <Badge
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-600"
                  >
                    OK
                  </Badge>
                );
              } else if (
                resultLabel === "ERROR" ||
                resultLabel === "KO" ||
                resultLabel === "NOK"
              ) {
                resultBadge = <Badge variant="destructive">ERROR</Badge>;
              } else {
                resultBadge = <Badge variant="secondary">{resultLabel}</Badge>;
              }

              const href = `/processing/${encodeURIComponent(r.id)}`;
              const onActivate = () => router.push(href);

              return (
                <TableRow
                  key={r.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  role="link"
                  tabIndex={0}
                  onClick={onActivate}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onActivate();
                    }
                  }}
                >
                  <TableCell className="font-mono text-xs">
                    {formatShortTime(r.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">{r.unit}</TableCell>
                  <TableCell>{r.lot}</TableCell>
                  <TableCell>{r.expiration}</TableCell>
                  <TableCell className="text-center">
                    {datamatrixIcon}
                  </TableCell>
                  <TableCell className="text-center">{erpIcon}</TableCell>
                  <TableCell>{resultBadge}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-44" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>
      <div className="rounded-xl border p-3 space-y-2">
        {LOADING_ROW_KEYS.map((k) => (
          <Skeleton key={k} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}

function formatShortTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "2-digit",
  }).format(d);
}
