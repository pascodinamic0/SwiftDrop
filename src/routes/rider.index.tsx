import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, DollarSign } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/rider/")({
  component: RiderJobs,
});

interface JobRow {
  id: string; status: string; delivery_fee: number; total: number;
  delivery_address: string; customer_name: string; store_id: string;
  created_at: string;
}
interface StoreLite { id: string; name: string; address: string; }

function RiderJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [stores, setStores] = useState<Record<string, StoreLite>>({});

  const load = async () => {
    // Available = ready + no rider assigned
    const { data } = await supabase.from("orders").select("*").eq("status", "ready").is("rider_id", null).order("created_at", { ascending: false });
    const rows = (data ?? []) as JobRow[];
    setJobs(rows);
    if (rows.length) {
      const ids = [...new Set(rows.map((r) => r.store_id))];
      const { data: s } = await supabase.from("stores").select("id,name,address").in("id", ids);
      const map: Record<string, StoreLite> = {};
      (s ?? []).forEach((x) => { map[(x as StoreLite).id] = x as StoreLite; });
      setStores(map);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const ch = supabase.channel("rider-available")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const accept = async (orderId: string) => {
    if (!user) return;
    const { error } = await supabase.from("orders")
      .update({ rider_id: user.id, status: "picked_up", picked_up_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("status", "ready")
      .is("rider_id", null);
    if (error) return toast.error(error.message);
    toast.success("Job accepted! Head to pickup.");
    navigate({ to: "/rider/active" });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="font-display text-2xl font-bold">Available jobs</h1>
      <p className="text-sm text-muted-foreground">First to accept wins.</p>

      {jobs.length === 0 ? (
        <Card className="mt-6 p-12 text-center text-muted-foreground">
          <Package className="h-10 w-10 mx-auto opacity-50 mb-3" />
          No jobs right now. Check back soon!
        </Card>
      ) : (
        <div className="mt-4 space-y-3">
          {jobs.map((j) => {
            const store = stores[j.store_id];
            return (
              <Card key={j.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">#{j.id.slice(0, 6)}</Badge>
                      <Badge className="bg-primary/10 text-primary border-primary/30">Ready for pickup</Badge>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" /><div><p className="font-semibold">Pickup</p><p className="text-muted-foreground">{store?.name} — {store?.address}</p></div></div>
                      <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-secondary shrink-0" /><div><p className="font-semibold">Drop-off</p><p className="text-muted-foreground">{j.delivery_address}</p></div></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><DollarSign className="h-3 w-3" />Your fee</div>
                    <div className="font-display text-2xl font-bold text-primary">${Number(j.delivery_fee).toFixed(2)}</div>
                    <p className="text-[10px] text-muted-foreground">cash on delivery</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="hero" className="flex-1" onClick={() => accept(j.id)}>Accept</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
