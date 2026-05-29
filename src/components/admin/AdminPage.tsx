import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function AdminPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full min-w-0 max-w-full px-4 py-8 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

export function AdminPanel({
  title,
  description,
  icon: Icon,
  children,
  className,
  contentClassName,
  footer,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  footer?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80 bg-card/95 shadow-card backdrop-blur-sm",
        className,
      )}
    >
      {(title || description) && (
        <div className="flex items-start gap-3 border-b border-border/60 bg-muted/30 px-5 py-4 sm:px-6">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            {title && <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
      )}
      <div className={cn("p-5 sm:p-6", contentClassName)}>{children}</div>
      {footer && (
        <div className="border-t border-border/60 bg-muted/20 px-5 py-4 sm:px-6">{footer}</div>
      )}
    </Card>
  );
}

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "muted";
}) {
  const accentMap = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <Card className="relative overflow-hidden border-border/80 bg-card/95 p-5 shadow-card">
      <div
        className={cn(
          "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl",
          accentMap[accent],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}

export function AdminToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "flex min-w-0 flex-col gap-3 border-border/80 bg-card/95 p-4 shadow-card backdrop-blur-sm md:flex-row md:items-center",
        className,
      )}
    >
      {children}
    </Card>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <p className="font-display text-lg font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
