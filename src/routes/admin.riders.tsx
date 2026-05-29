import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminEmptyState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/AdminPage";
import { toast } from "sonner";
import type { RiderProfile, RiderVerificationStatus } from "@/lib/roles";
import { riderStatusLabel } from "@/lib/roles";
import { reviewRiderApplication } from "@/lib/rider-notifications";
import { Bike, DollarSign, Package, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/riders")({
  component: AdminRiders,
});

interface RiderRow extends RiderProfile {
  profiles: { full_name: string | null; phone: string | null } | null;
}

const FILTER_OPTIONS = ["pending", "approved", "rejected", "all"] as const;

function AdminRiders() {
  const [riders, setRiders] = useState<RiderRow[]>([]);
  const [filter, setFilter] = useState<"all" | RiderVerificationStatus>("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    const { data: riderData, error } = await supabase
      .from("rider_profiles")
      .select("*")
      .order("applied_at", { ascending: false, nullsFirst: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    const rows = (riderData ?? []) as RiderProfile[];
    const ids = rows.map((r) => r.id);
    const profileMap: Record<string, { full_name: string | null; phone: string | null }> = {};
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", ids);
      (profiles ?? []).forEach((p) => {
        profileMap[p.id] = { full_name: p.full_name, phone: p.phone };
      });
    }
    setRiders(
      rows.map((r) => ({
        ...r,
        profiles: profileMap[r.id] ?? null,
      })),
    );
  };

  useEffect(() => {
    void load();
  }, []);

  const approve = async (riderId: string) => {
    try {
      await reviewRiderApplication({ riderId, decision: "approved" });
      toast.success("Rider approved");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
    }
  };

  const reject = async (riderId: string) => {
    if (!rejectReason.trim()) {
      toast.error("Add a rejection reason");
      return;
    }
    try {
      await reviewRiderApplication({
        riderId,
        decision: "rejected",
        rejectionReason: rejectReason.trim(),
      });
      toast.success("Application rejected");
      setRejectingId(null);
      setRejectReason("");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rejection failed");
    }
  };

  const filtered = riders.filter((r) => filter === "all" || r.verification_status === filter);
  const pendingCount = riders.filter((r) => r.verification_status === "pending").length;

  return (
    <AdminPage className="space-y-6">
      <AdminPageHeader
        title="Riders"
        description="Review applications, approve fleet members, and monitor performance."
        badge={
          <Badge
            variant={pendingCount > 0 ? "default" : "secondary"}
            className="font-normal"
          >
            {pendingCount} pending
          </Badge>
        }
        actions={
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/80 bg-card/80 p-1 shadow-sm">
            {FILTER_OPTIONS.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "ghost"}
                className="h-8"
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : riderStatusLabel(f)}
              </Button>
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={Bike}
          title="No riders in this view"
          description="Switch filters or wait for new applications."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <AdminPanel
              key={r.id}
              contentClassName="space-y-4"
              className={cn(
                r.verification_status === "pending" && "ring-1 ring-primary/25",
              )}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-semibold tracking-tight">
                      {r.profiles?.full_name || "Unnamed rider"}
                    </h3>
                    <StatusBadge status={r.verification_status} />
                    <Badge variant="outline" className="capitalize">
                      {r.vehicle}
                    </Badge>
                    {r.is_online && r.verification_status === "approved" && (
                      <Badge className="bg-success text-success-foreground">Online</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.profiles?.phone || "No phone"} · {r.city || "No city"}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{r.id}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <Metric icon={DollarSign} label="Earned" value={`$${Number(r.total_earnings).toFixed(2)}`} />
                  <Metric icon={Package} label="Deliveries" value={r.total_deliveries} />
                  <Metric icon={Wallet} label="Cash" value={`$${Number(r.cash_collected).toFixed(2)}`} />
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <Detail label="Date of birth" value={r.date_of_birth} />
                <Detail label="Home address" value={r.home_address} />
                <Detail label="Government ID" value={r.government_id} />
                <Detail label="Emergency contact" value={r.emergency_contact_name} />
                <Detail label="Emergency phone" value={r.emergency_contact_phone} />
                <Detail label="License plate" value={r.license_plate} />
                <Detail
                  label="Applied"
                  value={r.applied_at ? new Date(r.applied_at).toLocaleString() : null}
                />
                <Detail label="Notes" value={r.application_notes} className="sm:col-span-2 lg:col-span-3" />
              </div>

              {r.rejection_reason && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  Rejection reason: {r.rejection_reason}
                </p>
              )}

              {r.verification_status === "pending" && (
                <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row">
                  <Button variant="hero" onClick={() => approve(r.id)}>
                    Approve rider
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejectingId(rejectingId === r.id ? null : r.id)}
                  >
                    Reject application
                  </Button>
                </div>
              )}

              {rejectingId === r.id && (
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4">
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection (shown to the rider)"
                    rows={2}
                  />
                  <Button variant="destructive" size="sm" onClick={() => reject(r.id)}>
                    Confirm rejection
                  </Button>
                </div>
              )}
            </AdminPanel>
          ))}
        </div>
      )}
    </AdminPage>
  );
}

function StatusBadge({ status }: { status: RiderVerificationStatus }) {
  const styles: Record<RiderVerificationStatus, string> = {
    pending: "border-warning/40 bg-warning/15 text-warning-foreground",
    approved: "border-success/40 bg-success/15 text-success-foreground",
    rejected: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  return (
    <Badge variant="outline" className={cn("capitalize", styles[status])}>
      {riderStatusLabel(status)}
    </Badge>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-bold">{value}</p>
    </div>
  );
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
