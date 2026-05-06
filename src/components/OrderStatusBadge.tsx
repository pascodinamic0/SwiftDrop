import { Badge } from "@/components/ui/badge";

const MAP: Record<string, { label: string; cls: string }> = {
  pending_confirmation: { label: "Pending confirmation", cls: "bg-warning text-warning-foreground" },
  awaiting_payment: { label: "Awaiting payment", cls: "bg-warning text-warning-foreground" },
  preparing: { label: "Preparing", cls: "bg-primary text-primary-foreground" },
  ready: { label: "Ready for pickup", cls: "bg-primary text-primary-foreground" },
  picked_up: { label: "On the way", cls: "bg-primary text-primary-foreground" },
  delivered: { label: "Delivered", cls: "bg-success text-success-foreground" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground" },
  rejected: { label: "Rejected", cls: "bg-destructive text-destructive-foreground" },
  failed: { label: "Failed", cls: "bg-destructive text-destructive-foreground" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const v = MAP[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <Badge className={v.cls}>{v.label}</Badge>;
}

export const ORDER_STATUSES = Object.keys(MAP);
