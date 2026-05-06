import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { toast } from "sonner";
import { Check, X, ChefHat, Bell } from "lucide-react";

export const Route = createFileRoute("/vendor/")({
  component: VendorOrders,
});

interface OrderRow {
  id: string; status: string; total: number; subtotal: number; delivery_fee: number;
  customer_name: string; customer_phone: string; delivery_address: string; notes: string | null;
  created_at: string; rejection_reason: string | null;
}
interface ItemRow { id: string; order_id: string; name: string; quantity: number; line_total: number; }

function VendorOrders() {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<Record<string, ItemRow[]>>({});
  const [reasonFor, setReasonFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = async (sid: string) => {
    const { data } = await supabase.from("orders").select("*").eq("store_id", sid)
      .in("status", ["pending_confirmation", "awaiting_payment", "preparing", "ready"])
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as OrderRow[];
    setOrders(rows);
    if (rows.length) {
      const ids = rows.map((r) => r.id);
      const { data: it } = await supabase.from("order_items").select("*").in("order_id", ids);
      const map: Record<string, ItemRow[]> = {};
      ((it ?? []) as ItemRow[]).forEach((x) => { (map[x.order_id] ||= []).push(x); });
      setItems(map);
    }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("stores").select("id").eq("owner_id", user.id).limit(1).single();
      const sid = (data as { id: string } | null)?.id ?? null;
      setStoreId(sid);
      if (sid) load(sid);
    })();
  }, [user]);

  useEffect(() => {
    if (!storeId) return;
    const ch = supabase.channel(`vendor-${storeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `store_id=eq.${storeId}` }, () => load(storeId))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [storeId]);

  const accept = async (id: string) => {
    const { error } = await supabase.from("orders").update({ status: "awaiting_payment", confirmed_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Confirmed — customer will pay");
  };

  const reject = async (id: string) => {
    if (!reason.trim()) return toast.error("Add a reason");
    const { error } = await supabase.from("orders").update({ status: "rejected", rejection_reason: reason, cancelled_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order rejected");
    setReasonFor(null); setReason("");
  };

  const setStatus = async (id: string, status: "preparing" | "ready") => {
    const patch: { status: string; ready_at?: string } = { status };
    if (status === "ready") patch.ready_at = new Date().toISOString();
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Bell className="h-5 w-5" /> Live orders</h1>
      <p className="text-sm text-muted-foreground">{orders.length} active</p>

      {orders.length === 0 ? (
        <Card className="mt-6 p-12 text-center text-muted-foreground"><ChefHat className="h-10 w-10 mx-auto opacity-50 mb-3" />No active orders.</Card>
      ) : (
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {orders.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <OrderStatusBadge status={o.status} />
                <span className="text-xs font-mono text-muted-foreground">#{o.id.slice(0, 8)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleTimeString()}</p>
              <div className="mt-3 space-y-1 text-sm">
                {(items[o.id] ?? []).map((it) => (
                  <div key={it.id} className="flex justify-between"><span>{it.quantity}× {it.name}</span><span className="font-mono text-xs">${Number(it.line_total).toFixed(2)}</span></div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <p><strong className="text-foreground">{o.customer_name}</strong> · {o.customer_phone}</p>
                <p>{o.delivery_address}</p>
                {o.notes && <p className="italic mt-1">"{o.notes}"</p>}
              </div>

              {reasonFor === o.id ? (
                <div className="mt-3 space-y-2">
                  <Input placeholder="Reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => reject(o.id)}>Confirm reject</Button>
                    <Button size="sm" variant="outline" onClick={() => { setReasonFor(null); setReason(""); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  {o.status === "pending_confirmation" && <>
                    <Button size="sm" variant="hero" className="flex-1" onClick={() => accept(o.id)}><Check className="h-4 w-4" /> Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => setReasonFor(o.id)}><X className="h-4 w-4" /></Button>
                  </>}
                  {o.status === "awaiting_payment" && <span className="text-xs text-muted-foreground">Waiting for customer payment…</span>}
                  {o.status === "preparing" && <Button size="sm" variant="hero" className="flex-1" onClick={() => setStatus(o.id, "ready")}>Mark ready for pickup</Button>}
                  {o.status === "ready" && <span className="text-xs text-primary font-semibold">Awaiting rider…</span>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
