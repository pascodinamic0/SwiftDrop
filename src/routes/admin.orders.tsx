import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderStatusBadge, ORDER_STATUSES } from "@/components/OrderStatusBadge";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type OrderStatus = "pending_confirmation" | "awaiting_payment" | "preparing" | "ready" | "picked_up" | "delivered" | "cancelled" | "rejected" | "failed";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

interface Row { id: string; status: OrderStatus; total: number; customer_name: string; delivery_address: string; created_at: string; store_id: string; }

function AdminOrders() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState(""); const [filter, setFilter] = useState("all");

  const load = async () => {
    const { data } = await supabase.from("orders").select("id,status,total,customer_name,delivery_address,created_at,store_id").order("created_at", { ascending: false }).limit(200);
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) =>
    (filter === "all" || r.status === filter) &&
    (q === "" || r.customer_name.toLowerCase().includes(q.toLowerCase()) || r.delivery_address.toLowerCase().includes(q.toLowerCase()) || r.id.includes(q))
  );

  const setStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message); toast.success(`Set to ${status}`); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete order?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message); load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="font-display text-3xl font-bold">Orders ({filtered.length})</h1>
      <Card className="p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem>{ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </Card>
      <Card className="p-0">
        <div className="divide-y divide-border max-h-[70vh] overflow-auto">
          {filtered.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-4 hover:bg-muted/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><OrderStatusBadge status={r.status} /><span className="text-xs font-mono text-muted-foreground">#{r.id.slice(0, 8)}</span></div>
                <p className="text-sm mt-1 truncate">{r.customer_name} → {r.delivery_address}</p>
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <div className="font-display font-bold w-20 text-right">${Number(r.total).toFixed(2)}</div>
              <Select value={r.status} onValueChange={(v) => setStatus(r.id, v as OrderStatus)}>
                <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No orders</p>}
        </div>
      </Card>
    </div>
  );
}
