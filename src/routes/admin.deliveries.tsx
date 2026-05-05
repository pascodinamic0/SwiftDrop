import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StatusBadge } from "./customer";
import { Trash2, Search } from "lucide-react";

export const Route = createFileRoute("/admin/deliveries")({
  head: () => ({ meta: [{ title: "Deliveries — Admin" }] }),
  component: AdminDeliveries,
});

interface DRow {
  id: string; status: string; price: number; distance_km: number;
  pickup_address: string; dropoff_address: string; delivery_type: string;
  package_size: string; created_at: string; customer_id: string; agent_id: string | null;
}

const STATUSES = ["pending", "accepted", "picked_up", "in_transit", "delivered", "cancelled"];

function AdminDeliveries() {
  const [rows, setRows] = useState<DRow[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    const { data } = await supabase.from("deliveries").select("*").order("created_at", { ascending: false }).limit(200);
    setRows((data ?? []) as DRow[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) =>
    (filter === "all" || r.status === filter) &&
    (q === "" || r.pickup_address.toLowerCase().includes(q.toLowerCase()) || r.dropoff_address.toLowerCase().includes(q.toLowerCase()) || r.id.includes(q))
  );

  const updateStatus = async (id: string, status: string) => {
    const patch: Record<string, unknown> = { status };
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    if (status === "accepted") patch.accepted_at = new Date().toISOString();
    const { error } = await supabase.from("deliveries").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this delivery permanently?")) return;
    const { error } = await supabase.from("deliveries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Deliveries</h1>
        <p className="text-muted-foreground text-sm">{filtered.length} of {rows.length} shown</p>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search address or id…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-border max-h-[70vh] overflow-auto">
          {filtered.map((d) => (
            <div key={d.id} className="flex flex-col md:flex-row md:items-center gap-3 p-4 hover:bg-muted/30">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={d.status} />
                  <span className="text-xs text-muted-foreground">{d.delivery_type === "drone" ? "🚁" : "🛵"} {d.package_size} · {Number(d.distance_km).toFixed(1)} km</span>
                  <span className="text-xs font-mono text-muted-foreground">{d.id.slice(0, 8)}</span>
                </div>
                <p className="text-sm truncate mt-1">{d.pickup_address} → {d.dropoff_address}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(d.created_at).toLocaleString()}</p>
              </div>
              <div className="font-display text-lg font-bold w-20 text-right">${Number(d.price).toFixed(2)}</div>
              <div className="flex items-center gap-2">
                <Select value={d.status} onValueChange={(v) => updateStatus(d.id, v)}>
                  <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No deliveries match</p>}
        </div>
      </Card>
    </div>
  );
}
