import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Package as PackageIcon, DollarSign, Bike, Plane, Star, Clock, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "./customer";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Overview — Admin" }] }),
  component: AdminOverview,
});

interface DRow {
  id: string; status: string; price: number; distance_km: number;
  pickup_address: string; dropoff_address: string; delivery_type: string;
  package_size: string; created_at: string;
}

function AdminOverview() {
  const [stats, setStats] = useState({
    total: 0, revenue: 0, users: 0, agents: 0, online: 0,
    pending: 0, active: 0, delivered: 0, drone: 0, avgPrice: 0,
  });
  const [recent, setRecent] = useState<DRow[]>([]);

  useEffect(() => { (async () => {
    const [{ data: d }, { data: u }, { data: a }, { data: r }] = await Promise.all([
      supabase.from("deliveries").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id"),
      supabase.from("agent_profiles").select("id,is_online"),
      supabase.from("ratings").select("stars"),
    ]);
    const ds = (d ?? []) as DRow[];
    const delivered = ds.filter((x) => x.status === "delivered");
    const revenue = delivered.reduce((s, x) => s + Number(x.price), 0);
    setStats({
      total: ds.length,
      revenue,
      users: u?.length ?? 0,
      agents: a?.length ?? 0,
      online: (a ?? []).filter((x) => x.is_online).length,
      pending: ds.filter((x) => x.status === "pending").length,
      active: ds.filter((x) => ["accepted", "picked_up", "in_transit"].includes(x.status)).length,
      delivered: delivered.length,
      drone: ds.filter((x) => x.delivery_type === "drone").length,
      avgPrice: delivered.length ? revenue / delivered.length : 0,
    });
    void r;
    setRecent(ds.slice(0, 8));
  })(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm">Real-time operational snapshot</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat icon={PackageIcon} label="Deliveries" value={stats.total} />
        <Stat icon={DollarSign} label="Revenue" value={`$${stats.revenue.toFixed(2)}`} />
        <Stat icon={Users} label="Users" value={stats.users} />
        <Stat icon={Bike} label="Agents online" value={`${stats.online}/${stats.agents}`} />
        <Stat icon={Plane} label="Drone jobs" value={stats.drone} />
        <Stat icon={Clock} label="Pending" value={stats.pending} accent="warning" />
        <Stat icon={Bike} label="Active" value={stats.active} accent="primary" />
        <Stat icon={CheckCircle2} label="Delivered" value={stats.delivered} accent="success" />
        <Stat icon={Star} label="Avg ticket" value={`$${stats.avgPrice.toFixed(2)}`} />
        <Stat icon={DollarSign} label="Per km est" value={`$${(stats.avgPrice / 3).toFixed(2)}`} />
      </div>

      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold mb-4">Latest activity</h2>
        <div className="space-y-2">
          {recent.map((d) => (
            <div key={d.id} className="flex justify-between items-center gap-3 p-3 rounded-lg border border-border">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={d.status} />
                  <span className="text-xs text-muted-foreground">{d.delivery_type === "drone" ? "🚁" : "🛵"} {d.package_size}</span>
                </div>
                <p className="text-sm truncate mt-1">{d.pickup_address} → {d.dropoff_address}</p>
              </div>
              <div className="text-right text-sm font-bold">${Number(d.price).toFixed(2)}</div>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No deliveries yet</p>}
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string | number;
  accent?: "primary" | "success" | "warning";
}) {
  const tint = accent === "primary" ? "text-primary" : accent === "success" ? "text-success" : accent === "warning" ? "text-warning" : "text-foreground";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Icon className="h-4 w-4" />{label}</div>
      <div className={`font-display text-2xl font-bold ${tint}`}>{value}</div>
    </Card>
  );
}
