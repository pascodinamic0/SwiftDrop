import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { RiderProfile, RiderVerificationStatus } from "@/lib/roles";
import { riderStatusLabel } from "@/lib/roles";
import { reviewRiderApplication } from "@/lib/rider-notifications";

export const Route = createFileRoute("/admin/riders")({
  component: AdminRiders,
});

interface RiderRow extends RiderProfile {
  profiles: { full_name: string | null; phone: string | null } | null;
}

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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">Riders ({riders.length})</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCount} application{pendingCount === 1 ? "" : "s"} awaiting review
          </p>
        </div>
        <div className="flex gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : riderStatusLabel(f)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-lg">{r.profiles?.full_name || "Unnamed rider"}</p>
                  <Badge variant="outline" className="capitalize">{riderStatusLabel(r.verification_status)}</Badge>
                  <Badge variant="secondary" className="capitalize">{r.vehicle}</Badge>
                  {r.is_online && r.verification_status === "approved" && (
                    <Badge className="bg-success text-success-foreground">Online</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {r.profiles?.phone || "No phone"} · {r.city || "No city"}
                </p>
                <p className="text-xs font-mono text-muted-foreground mt-1">{r.id.slice(0, 12)}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center min-w-[240px]">
                <div>
                  <p className="text-[10px] text-muted-foreground">Earned</p>
                  <p className="font-display font-bold">${Number(r.total_earnings).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Deliveries</p>
                  <p className="font-display font-bold">{r.total_deliveries}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Cash</p>
                  <p className="font-display font-bold">${Number(r.cash_collected).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <Detail label="Date of birth" value={r.date_of_birth} />
              <Detail label="Home address" value={r.home_address} />
              <Detail label="Government ID" value={r.government_id} />
              <Detail label="Emergency contact" value={r.emergency_contact_name} />
              <Detail label="Emergency phone" value={r.emergency_contact_phone} />
              <Detail label="License plate" value={r.license_plate} />
              <Detail label="Applied" value={r.applied_at ? new Date(r.applied_at).toLocaleString() : null} />
              <Detail label="Notes" value={r.application_notes} />
            </div>

            {r.rejection_reason && (
              <p className="mt-3 text-sm text-destructive">Rejection reason: {r.rejection_reason}</p>
            )}

            {r.verification_status === "pending" && (
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Button onClick={() => approve(r.id)}>Approve rider</Button>
                <Button variant="outline" onClick={() => setRejectingId(rejectingId === r.id ? null : r.id)}>
                  Reject
                </Button>
              </div>
            )}

            {rejectingId === r.id && (
              <div className="mt-3 space-y-2">
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
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">No riders in this view.</Card>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
