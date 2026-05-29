import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Store, Bike, DollarSign, ArrowRight } from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
} from "@/components/admin/AdminPage";

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
        supabase
          .from("orders")
          .select("id", { count: "exact" })
          .in("status", [
            "pending_confirmation",
            "awaiting_payment",
            "preparing",
            "ready",
            "picked_up",
          ]),
        supabase.from("stores").select("id", { count: "exact" }),
        supabase.from("rider_profiles").select("id", { count: "exact" }),
      ]);
      const revenue = ((oAll.data ?? []) as { total: number; status: string }[])
        .filter((o) => o.status === "delivered")
        .reduce((s, o) => s + Number(o.total), 0);
      setStats({
        orders: oAll.count ?? 0,
        active: oAct.count ?? 0,
        stores: sAll.count ?? 0,
        riders: rAll.count ?? 0,
        revenue,
      });
    })();
  }, []);

  const cards = [
    { i: DollarSign, l: "Total revenue", v: `$${stats.revenue.toFixed(2)}`, accent: "primary" as const },
    { i: Package, l: "Active orders", v: stats.active, accent: "warning" as const },
    { i: Package, l: "All orders", v: stats.orders, accent: "muted" as const },
    { i: Store, l: "Stores", v: stats.stores, accent: "success" as const },
    { i: Bike, l: "Riders", v: stats.riders, accent: "muted" as const },
  ];

  const quickLinks = [
    { to: "/admin/orders" as const, label: "Manage orders", hint: `${stats.active} in progress` },
    { to: "/admin/stores" as const, label: "Stores & vendors", hint: `${stats.stores} listed` },
    { to: "/admin/riders" as const, label: "Rider applications", hint: `${stats.riders} profiles` },
  ];

  return (
    <AdminPage>
      <AdminPageHeader
        title="Overview"
        description="Key metrics and shortcuts for running SwiftDrop day to day."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
        {cards.map((c) => (
          <AdminStatCard key={c.l} label={c.l} value={c.v} icon={c.i} accent={c.accent} />
        ))}
      </div>

      <AdminPanel
        title="Quick actions"
        description="Jump to the areas you manage most often."
        className="mt-8"
        contentClassName="p-0"
      >
        <ul className="divide-y divide-border/60">
          {quickLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40 sm:px-6"
              >
                <div>
                  <p className="font-medium">{link.label}</p>
                  <p className="text-sm text-muted-foreground">{link.hint}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </AdminPanel>
    </AdminPage>
  );
}
