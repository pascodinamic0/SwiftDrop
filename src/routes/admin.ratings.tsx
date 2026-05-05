import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

export const Route = createFileRoute("/admin/ratings")({
  head: () => ({ meta: [{ title: "Ratings — Admin" }] }),
  component: AdminRatings,
});

interface RRow {
  id: string; stars: number; comment: string | null; created_at: string;
  agent_id: string; customer_id: string; delivery_id: string;
}

function AdminRatings() {
  const [rows, setRows] = useState<RRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => { (async () => {
    const { data } = await supabase.from("ratings").select("*").order("created_at", { ascending: false }).limit(200);
    const list = (data ?? []) as RRow[];
    setRows(list);
    const ids = Array.from(new Set(list.flatMap((r) => [r.agent_id, r.customer_id])));
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", ids);
      const m: Record<string, string> = {};
      (profiles ?? []).forEach((p) => { m[p.id] = p.full_name ?? p.id.slice(0, 8); });
      setNames(m);
    }
  })(); }, []);

  const avg = rows.length ? rows.reduce((s, r) => s + r.stars, 0) / rows.length : 0;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Ratings</h1>
        <p className="text-muted-foreground text-sm">{rows.length} reviews · avg ⭐ {avg.toFixed(2)}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {rows.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < r.stars ? "fill-primary text-primary" : "text-muted"}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-sm">{r.comment || <em className="text-muted-foreground">No comment</em>}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {names[r.customer_id] ?? "Customer"} → {names[r.agent_id] ?? "Agent"}
            </p>
          </Card>
        ))}
        {rows.length === 0 && <Card className="p-8 text-center text-muted-foreground col-span-full">No ratings yet</Card>}
      </div>
    </div>
  );
}
