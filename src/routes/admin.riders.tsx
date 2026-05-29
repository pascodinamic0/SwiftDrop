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
import { getRiderStatusLabel } from "@/lib/rider-status";
import { useTranslation } from "@/i18n";
import type { TFunction } from "@/i18n/translate";
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
  const { t } = useTranslation();
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
      toast.success(t("admin.riderApproved"));
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.approvalFailed"));
    }
  };

  const reject = async (riderId: string) => {
    if (!rejectReason.trim()) {
      toast.error(t("admin.addRejectionReason"));
      return;
    }
    try {
      await reviewRiderApplication({
        riderId,
        decision: "rejected",
        rejectionReason: rejectReason.trim(),
      });
      toast.success(t("admin.applicationRejected"));
      setRejectingId(null);
      setRejectReason("");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.rejectionFailed"));
    }
  };

  const filtered = riders.filter((r) => filter === "all" || r.verification_status === filter);
  const pendingCount = riders.filter((r) => r.verification_status === "pending").length;

  return (
    <AdminPage className="space-y-6">
      <AdminPageHeader
        title={t("admin.riders")}
        description={t("admin.console")}
        badge={
          <Badge
            variant={pendingCount > 0 ? "default" : "secondary"}
            className="font-normal"
          >
            {t("admin.awaitingReview", { count: pendingCount })}
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
                {f === "all" ? t("common.all") : getRiderStatusLabel(f, t)}
              </Button>
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={Bike}
          title={t("admin.noRiders")}
          description={t("admin.console")}
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
                      {r.profiles?.full_name || t("common.unnamedRider")}
                    </h3>
                    <StatusBadge status={r.verification_status} t={t} />
                    <Badge variant="outline" className="capitalize">
                      {r.vehicle}
                    </Badge>
                    {r.is_online && r.verification_status === "approved" && (
                      <Badge className="bg-success text-success-foreground">{t("common.online")}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.profiles?.phone || t("common.noPhone")} · {r.city || t("common.noCity")}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{r.id}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <Metric icon={DollarSign} label={t("admin.earned")} value={`$${Number(r.total_earnings).toFixed(2)}`} />
                  <Metric icon={Package} label={t("admin.deliveriesLabel")} value={r.total_deliveries} />
                  <Metric icon={Wallet} label={t("admin.cash")} value={`$${Number(r.cash_collected).toFixed(2)}`} />
                </div>
              </div>

              <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <Detail label={t("admin.dob")} value={r.date_of_birth} dash={t("common.dash")} />
                <Detail label={t("admin.homeAddress")} value={r.home_address} dash={t("common.dash")} />
                <Detail label={t("admin.governmentId")} value={r.government_id} dash={t("common.dash")} />
                <Detail label={t("admin.emergencyContact")} value={r.emergency_contact_name} dash={t("common.dash")} />
                <Detail label={t("admin.emergencyPhone")} value={r.emergency_contact_phone} dash={t("common.dash")} />
                <Detail label={t("admin.licensePlate")} value={r.license_plate} dash={t("common.dash")} />
                <Detail
                  label={t("admin.applied")}
                  value={r.applied_at ? new Date(r.applied_at).toLocaleString() : null}
                  dash={t("common.dash")}
                />
                <Detail label={t("admin.notes")} value={r.application_notes} className="sm:col-span-2 lg:col-span-3" dash={t("common.dash")} />
              </div>

              {r.rejection_reason && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {t("admin.rejectionReason", { reason: r.rejection_reason })}
                </p>
              )}

              {r.verification_status === "pending" && (
                <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row">
                  <Button variant="hero" onClick={() => approve(r.id)}>
                    {t("admin.approveRider")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setRejectingId(rejectingId === r.id ? null : r.id)}
                  >
                    {t("admin.reject")}
                  </Button>
                </div>
              )}

              {rejectingId === r.id && (
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4">
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t("admin.rejectPlaceholder")}
                    rows={2}
                  />
                  <Button variant="destructive" size="sm" onClick={() => reject(r.id)}>
                    {t("admin.confirmRejection")}
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

function StatusBadge({ status, t }: { status: RiderVerificationStatus; t: TFunction }) {
  const styles: Record<RiderVerificationStatus, string> = {
    pending: "border-warning/40 bg-warning/15 text-warning-foreground",
    approved: "border-success/40 bg-success/15 text-success-foreground",
    rejected: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  return (
    <Badge variant="outline" className={cn("capitalize", styles[status])}>
      {getRiderStatusLabel(status, t)}
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
  dash,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
  dash: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value || dash}</p>
    </div>
  );
}
