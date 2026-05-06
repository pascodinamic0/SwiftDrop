import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface R { id: string; vehicle: string; is_online: boolean; total_earnings: number; total_deliveries: number; cash_collected: number; }

export const Route = createFileRoute("/admin/riders")({
  component: AdminRiders,
});

function AdminRiders() {
  const [riders, setRiders] = useState<R[]>([]);
  useEffect(() => {
    supabase.from("rider_profiles").select("*").order("total_deliveries", { ascending: false }).then(({ data }) => setRiders((data ?? []) as R[]));
  }, []);
  return (
    <div className="p-6 space-y-4">
      <h1 className="font-display text-3xl font-bold">Riders ({riders.length})</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {riders.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center gap-2"><Badge className={r.is_online ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>{r.is_online ? "Online" : "Offline"}</Badge><Badge variant="outline" className="capitalize">{r.vehicle}</Badge></div>
            <p className="text-xs font-mono text-muted-foreground mt-2">{r.id.slice(0, 12)}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div><p className="text-[10px] text-muted-foreground">Earned</p><p className="font-display font-bold">${Number(r.total_earnings).toFixed(2)}</p></div>
              <div><p className="text-[10px] text-muted-foreground">Deliveries</p><p className="font-display font-bold">{r.total_deliveries}</p></div>
              <div><p className="text-[10px] text-muted-foreground">Cash</p><p className="font-display font-bold">${Number(r.cash_collected).toFixed(2)}</p></div>
            </div>
          </Card>
        ))}
        {riders.length === 0 && <Card className="p-8 text-center text-muted-foreground col-span-full">No riders yet.</Card>}
      </div>
    </div>
  );
}
