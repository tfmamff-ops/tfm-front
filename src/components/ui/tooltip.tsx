"use client";

import * as React from "react";

type Ctx = { open: boolean; setOpen: (v: boolean) => void } | null;
const TooltipCtx = React.createContext<Ctx>(null);

export function TooltipProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // No global state required for this lightweight provider
  return <>{children}</>;
}

export function Tooltip({ children }: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = React.useState(false);
  const ctxValue = React.useMemo(() => ({ open, setOpen }), [open]);
  return (
    <TooltipCtx.Provider value={ctxValue}>
      <div className="relative inline-flex items-center">{children}</div>
    </TooltipCtx.Provider>
  );
}

export function TooltipTrigger({
  asChild = false,
  children,
}: Readonly<{ asChild?: boolean; children: React.ReactNode }>) {
  const ctx = React.useContext(TooltipCtx);
  if (!ctx) return <>{children}</>;
  const props = {
    onMouseEnter: () => ctx.setOpen(true),
    onMouseLeave: () => ctx.setOpen(false),
    onFocus: () => ctx.setOpen(true),
    onBlur: () => ctx.setOpen(false),
  } as const;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, props);
  }
  return (
    <button type="button" {...props} className="inline-flex">
      {children}
    </button>
  );
}

export function TooltipContent({
  children,
  side = "top",
}: Readonly<{
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}>) {
  const ctx = React.useContext(TooltipCtx);
  if (!ctx) return null;
  const base =
    "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-xs text-white shadow-md transition-opacity duration-150";
  const pos = {
    top: "-translate-y-2 bottom-full left-1/2 -translate-x-1/2",
    bottom: "translate-y-2 top-full left-1/2 -translate-x-1/2",
    left: "-translate-x-2 right-full top-1/2 -translate-y-1/2",
    right: "translate-x-2 left-full top-1/2 -translate-y-1/2",
  }[side];

  return (
    <div
      role="tooltip"
      className={`${base} ${pos} ${ctx.open ? "opacity-100" : "opacity-0"}`}
    >
      {children}
    </div>
  );
}
