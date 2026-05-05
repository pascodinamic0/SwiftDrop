import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Bike } from "lucide-react";

export const Route = createFileRoute("/admin/agents")({
  head: () => ({ meta: [{ title: "Agents — Admin" }] }),
  component: AdminAgents,
});

interface ARow {
  id: string; vehicle: string; is_online: boolean;
  total_deliveries: number; total_earnings: number;
  current_lat: number | null; current_lng: number | null;
  full_name: string | null; avg_rating: number | null;
}

function AdminAgents() {
  const [rows, setRows] = useState<ARow[]>([]);

  useEffect(() => { (async () => {
    const { data: agents } = await supabase.from("agent_profiles").select("*");
    const ids = (agents ?? []).map((a) => a.id);
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id,full_name,avg_rating").in("id", ids)
      : { data: [] as { id: string; full_name: string | null; avg_rating: number | null }[] };
    const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
    setRows((agents ?? []).map((a) => ({
      ...a,
      full_name: pmap.get(a.id)?.full_name ?? null,
      avg_rating: pmap.get(a.id)?.avg_rating ?? null,
    })) as ARow[]);
  })(); }, []);

  const online = rows.filter((r) => r.is_online).length;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground text-sm">{online} online · {rows.length} total</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((a) => (
          <Card key={a.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bike className="h-4 w-4 text-primary" />
                <p className="font-semibold">{a.full_name || "Unnamed"}</p>
              </div>
              <Badge className={a.is_online ? "bg-success text-success-foreground" : "bg-muted"}>
                {a.is_online ? "Online" : "Offline"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{a.id.slice(0, 12)}…</p>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div><div className="text-xs text-muted-foreground">Vehicle</div><div className="text-sm font-bold capitalize">{a.vehicle}</div></div>
              <div><div className="text-xs text-muted-foreground">Trips</div><div className="text-sm font-bold">{a.total_deliveries}</div></div>
              <div><div className="text-xs text-muted-foreground">Earned</div><div className="text-sm font-bold">${Number(a.total_earnings).toFixed(0)}</div></div>
            </div>
            <div className="text-xs text-muted-foreground pt-1">⭐ {Number(a.avg_rating ?? 0).toFixed(1)}</div>
          </Card>
        ))}
        {rows.length === 0 && <Card className="p-8 text-center text-muted-foreground col-span-full">No agents registered</Card>}
      </div>
    </div>
  );
}
