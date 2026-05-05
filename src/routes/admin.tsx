import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./customer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Package as PackageIcon, DollarSign, Settings } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — SwiftDrop" }] }),
  component: () => <RequireAuth role="admin"><AdminPanel /></RequireAuth>,
});

interface DeliveryRow {
  id: string; status: string; price: number; distance_km: number;
  pickup_address: string; dropoff_address: string; delivery_type: string;
  package_size: string; created_at: string; customer_id: string; agent_id: string | null;
}

interface PricingRow {
  base_fare: number; per_km: number;
  size_small: number; size_medium: number; size_large: number;
  drone_multiplier: number;
}

function AdminPanel() {
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string | null; avg_rating: number | null }[]>([]);
  const [pricing, setPricing] = useState<PricingRow | null>(null);
  const [stats, setStats] = useState({ total: 0, revenue: 0, users: 0 });

  const load = async () => {
    const { data: d } = await supabase.from("deliveries").select("*").order("created_at", { ascending: false }).limit(50);
    const { data: u } = await supabase.from("profiles").select("id,full_name,avg_rating").limit(50);
    const { data: p } = await supabase.from("pricing_config").select("*").eq("id", 1).maybeSingle();
    setDeliveries((d ?? []) as DeliveryRow[]);
    setUsers((u ?? []) as never);
    if (p) setPricing(p as PricingRow);
    const revenue = (d ?? []).filter((x) => x.status === "delivered").reduce((s, x) => s + Number(x.price), 0);
    setStats({ total: d?.length ?? 0, revenue, users: u?.length ?? 0 });
  };

  useEffect(() => { load(); }, []);

  const savePricing = async () => {
    if (!pricing) return;
    const { error } = await supabase.from("pricing_config").update({ ...pricing, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) { toast.error(error.message); return; }
    toast.success("Pricing updated");
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">System overview and configuration</p>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card className="p-4"><Stat icon={PackageIcon} label="Deliveries" value={stats.total.toString()} /></Card>
          <Card className="p-4"><Stat icon={DollarSign} label="Revenue" value={`$${stats.revenue.toFixed(2)}`} /></Card>
          <Card className="p-4"><Stat icon={Users} label="Users" value={stats.users.toString()} /></Card>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 mt-6">
          <Card className="p-5">
            <h2 className="font-display text-lg font-semibold mb-4">Recent deliveries</h2>
            <div className="space-y-2 max-h-[500px] overflow-auto">
              {deliveries.map((d) => (
                <div key={d.id} className="flex justify-between items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><StatusBadge status={d.status} /><span className="text-xs text-muted-foreground">{d.delivery_type === "drone" ? "🚁" : "🛵"} {d.package_size}</span></div>
                    <p className="text-sm truncate mt-1">{d.pickup_address} → {d.dropoff_address}</p>
                  </div>
                  <div className="text-right text-sm font-bold">${Number(d.price).toFixed(2)}</div>
                </div>
              ))}
              {deliveries.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No deliveries yet</p>}
            </div>
          </Card>

          {pricing && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4"><Settings className="h-4 w-4" /><h2 className="font-display text-lg font-semibold">Pricing rules</h2></div>
              <div className="space-y-3">
                {([
                  ["base_fare", "Base fare ($)"], ["per_km", "Per km ($)"],
                  ["size_small", "Small ×"], ["size_medium", "Medium ×"], ["size_large", "Large ×"],
                  ["drone_multiplier", "Drone ×"],
                ] as const).map(([k, label]) => (
                  <div key={k} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" step="0.1"
                      value={pricing[k]}
                      onChange={(e) => setPricing({ ...pricing, [k]: Number(e.target.value) })} />
                  </div>
                ))}
                <Button variant="hero" className="w-full" onClick={savePricing}>Save pricing</Button>
              </div>
            </Card>
          )}
        </div>

        <Card className="p-5 mt-6">
          <h2 className="font-display text-lg font-semibold mb-4">Users</h2>
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {users.map((u) => (
              <div key={u.id} className="flex justify-between items-center gap-3 p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm">{u.full_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}…</p>
                </div>
                <div className="text-xs">⭐ {Number(u.avg_rating ?? 0).toFixed(1)}</div>
              </div>
            ))}
            {users.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No users yet</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <>
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Icon className="h-4 w-4" />{label}</div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </>
  );
}
