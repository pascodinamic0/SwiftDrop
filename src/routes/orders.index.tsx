import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { RequireRole } from "@/components/RoleRouter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "My orders — SwiftDrop" }] }),
  component: () => <RequireRole><OrdersList /></RequireRole>,
});

interface OrderRow { id: string; status: string; total: number; created_at: string; store_id: string; }

function OrdersList() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("orders").select("id,status,total,created_at,store_id").eq("customer_id", user.id).order("created_at", { ascending: false });
      const rows = (data ?? []) as OrderRow[];
      setOrders(rows);
      if (rows.length) {
        const ids = [...new Set(rows.map((r) => r.store_id))];
        const { data: s } = await supabase.from("stores").select("id,name").in("id", ids);
        const map: Record<string, string> = {};
        (s ?? []).forEach((x) => { map[(x as { id: string; name: string }).id] = (x as { id: string; name: string }).name; });
        setStoreNames(map);
      }
    })();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="font-display text-3xl font-bold">My orders</h1>
        {orders.length === 0 ? (
          <Card className="mt-6 p-12 text-center text-muted-foreground">No orders yet. <Link to="/shop" className="text-primary font-semibold">Browse stores</Link></Card>
        ) : (
          <div className="mt-6 space-y-3">
            {orders.map((o) => (
              <Link key={o.id} to="/orders/$id" params={{ id: o.id }}>
                <Card className="p-4 flex items-center justify-between gap-3 hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><OrderStatusBadge status={o.status} /><span className="text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span></div>
                    <p className="mt-1 font-medium truncate">{storeNames[o.store_id] ?? "Store"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                  </div>
                  <div className="font-display text-xl font-bold">${Number(o.total).toFixed(2)}</div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
