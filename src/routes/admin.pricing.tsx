import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/admin/pricing")({
  head: () => ({ meta: [{ title: "Pricing — Admin" }] }),
  component: AdminPricing,
});

interface PricingRow {
  base_fare: number; per_km: number;
  size_small: number; size_medium: number; size_large: number;
  drone_multiplier: number;
}

function AdminPricing() {
  const [pricing, setPricing] = useState<PricingRow | null>(null);

  useEffect(() => { (async () => {
    const { data } = await supabase.from("pricing_config").select("*").eq("id", 1).maybeSingle();
    if (data) setPricing(data as PricingRow);
  })(); }, []);

  const save = async () => {
    if (!pricing) return;
    const { error } = await supabase.from("pricing_config").update({ ...pricing, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Pricing updated");
  };

  if (!pricing) return <div className="p-6 text-muted-foreground">Loading…</div>;

  const sample = (km: number, mult: number, drone = false) => {
    const p = (pricing.base_fare + km * pricing.per_km) * mult * (drone ? pricing.drone_multiplier : 1);
    return p.toFixed(2);
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="text-muted-foreground text-sm">Tune the fare formula for the whole platform</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4"><Settings className="h-4 w-4" /><h2 className="font-display text-lg font-semibold">Rules</h2></div>
          <div className="grid grid-cols-2 gap-3">
            {([
              ["base_fare", "Base fare ($)"],
              ["per_km", "Per km ($)"],
              ["size_small", "Small ×"],
              ["size_medium", "Medium ×"],
              ["size_large", "Large ×"],
              ["drone_multiplier", "Drone ×"],
            ] as const).map(([k, label]) => (
              <div key={k} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input type="number" step="0.1" value={pricing[k]}
                  onChange={(e) => setPricing({ ...pricing, [k]: Number(e.target.value) })} />
              </div>
            ))}
          </div>
          <Button variant="hero" className="w-full mt-4" onClick={save}>Save changes</Button>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold mb-4">Live preview</h2>
          <div className="space-y-3 text-sm">
            <Row label="2 km · Small (bike)" value={`$${sample(2, pricing.size_small)}`} />
            <Row label="5 km · Medium (bike)" value={`$${sample(5, pricing.size_medium)}`} />
            <Row label="10 km · Large (bike)" value={`$${sample(10, pricing.size_large)}`} />
            <Row label="5 km · Medium (drone)" value={`$${sample(5, pricing.size_medium, true)}`} />
            <Row label="10 km · Large (drone)" value={`$${sample(10, pricing.size_large, true)}`} />
          </div>
          <p className="text-xs text-muted-foreground mt-4">Formula: (base + km × per_km) × size × drone</p>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-display font-bold">{value}</span>
    </div>
  );
}
