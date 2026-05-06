import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Package, Store, Bike, DollarSign } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const [stats, setStats] = useState({ orders: 0, active: 0, stores: 0, riders: 0, revenue: 0 });

  useEffect(() => {
    (async () => {
      const [oAll, oAct, sAll, rAll] = await Promise.all([
        supabase.from("orders").select("total,status", { count: "exact" }),
        supabase.from("orders").select("id", { count: "exact" }).in("status", ["pending_confirmation","awaiting_payment","preparing","ready","picked_up"]),
        supabase.from("stores").select("id", { count: "exact" }),
        supabase.from("rider_profiles").select("id", { count: "exact" }),
      ]);
      const revenue = ((oAll.data ?? []) as { total: number; status: string }[]).filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0);
      setStats({ orders: oAll.count ?? 0, active: oAct.count ?? 0, stores: sAll.count ?? 0, riders: rAll.count ?? 0, revenue });
    })();
  }, []);

  const cards = [
    { i: DollarSign, l: "Total revenue", v: `$${stats.revenue.toFixed(2)}` },
    { i: Package, l: "Active orders", v: stats.active },
    { i: Package, l: "All orders", v: stats.orders },
    { i: Store, l: "Stores", v: stats.stores },
    { i: Bike, l: "Riders", v: stats.riders },
  ];

  return (
    <div className="p-6">
      <h1 className="font-display text-3xl font-bold">Overview</h1>
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <Card key={c.l} className="p-5"><c.i className="h-5 w-5 text-primary" /><p className="text-xs text-muted-foreground mt-2">{c.l}</p><p className="font-display text-2xl font-bold mt-1">{c.v}</p></Card>
        ))}
      </div>
    </div>
  );
}
