import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n";

const STATUS_KEYS = [
  "pending_confirmation",
  "awaiting_payment",
  "preparing",
  "ready",
  "picked_up",
  "delivered",
  "cancelled",
  "rejected",
  "failed",
] as const;

const STATUS_CLS: Record<string, string> = {
  pending_confirmation: "bg-warning text-warning-foreground",
  awaiting_payment: "bg-warning text-warning-foreground",
  preparing: "bg-primary text-primary-foreground",
  ready: "bg-primary text-primary-foreground",
  picked_up: "bg-primary text-primary-foreground",
  delivered: "bg-success text-success-foreground",
  cancelled: "bg-muted text-muted-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  failed: "bg-destructive text-destructive-foreground",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const cls = STATUS_CLS[status] ?? "bg-muted text-muted-foreground";
  const labelKey = `order.status.${status}`;
  const label =
    STATUS_KEYS.includes(status as (typeof STATUS_KEYS)[number]) ? t(labelKey) : status;

  return <Badge className={cls}>{label}</Badge>;
}

export const ORDER_STATUSES = STATUS_KEYS as unknown as string[];
