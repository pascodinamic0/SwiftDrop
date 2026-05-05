import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { DeliveryMap, type LatLng } from "@/components/DeliveryMap";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { calculatePrice, distanceKm, estimateMinutes, type DeliveryType, type PackageSize } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Package, Truck, Plane, MapPin, Star } from "lucide-react";

export const Route = createFileRoute("/customer")({
  head: () => ({ meta: [{ title: "Send a package — SwiftDrop" }] }),
  component: () => <RequireAuth><CustomerDash /></RequireAuth>,
});

interface DeliveryRow {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  price: number;
  distance_km: number;
  delivery_type: string;
  package_size: string;
  created_at: string;
  agent_id: string | null;
}

function CustomerDash() {
  const { user } = useAuth();
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [dropoff, setDropoff] = useState<LatLng | null>(null);
  const [pickupAddr, setPickupAddr] = useState("");
  const [dropoffAddr, setDropoffAddr] = useState("");
  const [size, setSize] = useState<PackageSize>("small");
  const [type, setType] = useState<DeliveryType>("human");
  const [notes, setNotes] = useState("");
  const [clickMode, setClickMode] = useState<"pickup" | "dropoff" | null>("pickup");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<DeliveryRow[]>([]);

  const distance = pickup && dropoff ? distanceKm(pickup, dropoff) : 0;
  const price = pickup && dropoff ? calculatePrice(distance, size, type) : 0;
  const eta = pickup && dropoff ? estimateMinutes(distance, type) : 0;

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("deliveries")
      .select("id,pickup_address,dropoff_address,status,price,distance_km,delivery_type,package_size,created_at,agent_id")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data ?? []) as DeliveryRow[]);
  };

  useEffect(() => { loadHistory(); }, [user]);

  // realtime: refresh on any change to my deliveries
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`my-deliveries-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries", filter: `customer_id=eq.${user.id}` }, loadHistory)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const handleMapClick = (p: LatLng) => {
    if (clickMode === "pickup") {
      setPickup(p);
      setPickupAddr(`${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`);
      setClickMode("dropoff");
    } else if (clickMode === "dropoff") {
      setDropoff(p);
      setDropoffAddr(`${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`);
      setClickMode(null);
    }
  };

  const submit = async () => {
    if (!user || !pickup || !dropoff) {
      toast.error("Set both pickup and drop-off");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("deliveries").insert({
      customer_id: user.id,
      pickup_address: pickupAddr || "Pickup", pickup_lat: pickup.lat, pickup_lng: pickup.lng,
      dropoff_address: dropoffAddr || "Drop-off", dropoff_lat: dropoff.lat, dropoff_lng: dropoff.lng,
      package_size: size, delivery_type: type, distance_km: distance, price, notes,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mock payment ✓ — Searching for an agent…");
    setPickup(null); setDropoff(null); setPickupAddr(""); setDropoffAddr(""); setNotes("");
    setClickMode("pickup");
    loadHistory();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[1fr_380px] gap-6 flex-1">
        {/* Map */}
        <div className="rounded-2xl overflow-hidden h-[420px] lg:h-auto lg:min-h-[600px]">
          <DeliveryMap pickup={pickup} dropoff={dropoff} isDrone={type === "drone"}
            onMapClick={handleMapClick} clickMode={clickMode} height="100%" />
        </div>

        {/* Form */}
        <Card className="p-6 h-fit">
          <h2 className="font-display text-2xl font-bold tracking-tight">New delivery</h2>
          <p className="text-sm text-muted-foreground mt-1">Tap the map to set pickup and drop-off.</p>

          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button variant={clickMode === "pickup" ? "hero" : "outline"} size="sm" onClick={() => setClickMode("pickup")}>
                <MapPin className="h-4 w-4" /> Pickup
              </Button>
              <Button variant={clickMode === "dropoff" ? "hero" : "outline"} size="sm" onClick={() => setClickMode("dropoff")}>
                <MapPin className="h-4 w-4" /> Drop-off
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Pickup address</Label>
              <Input value={pickupAddr} onChange={(e) => setPickupAddr(e.target.value)} placeholder="123 Main St" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Drop-off address</Label>
              <Input value={dropoffAddr} onChange={(e) => setDropoffAddr(e.target.value)} placeholder="456 Oak Ave" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Package size</Label>
              <RadioGroup value={size} onValueChange={(v) => setSize(v as PackageSize)} className="grid grid-cols-3 gap-2">
                {(["small","medium","large"] as PackageSize[]).map((s) => (
                  <label key={s} className={`cursor-pointer rounded-lg border p-3 text-center text-xs font-semibold capitalize transition-all ${size === s ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                    <RadioGroupItem value={s} className="sr-only" />
                    <Package className="h-4 w-4 mx-auto mb-1" />
                    {s}
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Delivery type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setType("human")} className={`rounded-lg border p-3 text-center text-xs font-semibold transition-all ${type === "human" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                  <Truck className="h-4 w-4 mx-auto mb-1" /> Courier
                </button>
                <button onClick={() => setType("drone")} className={`rounded-lg border p-3 text-center text-xs font-semibold transition-all ${type === "drone" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                  <Plane className="h-4 w-4 mx-auto mb-1" /> Drone <span className="text-primary">⚡</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Apt 4B, ring twice" rows={2} />
            </div>

            {pickup && dropoff && (
              <div className="rounded-xl bg-secondary text-secondary-foreground p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">Distance</span>
                  <span className="font-semibold">{distance.toFixed(2)} km</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">ETA</span>
                  <span className="font-semibold">~{eta} min</span>
                </div>
                <div className="border-t border-secondary-foreground/20 pt-2 flex justify-between items-baseline">
                  <span className="text-xs opacity-70">Total</span>
                  <span className="font-display text-3xl font-bold text-primary">${price.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button variant="hero" size="lg" className="w-full" disabled={!pickup || !dropoff || submitting} onClick={submit}>
              {submitting ? "Booking…" : "Confirm & pay (mock)"}
            </Button>
          </div>
        </Card>
      </div>

      {/* History */}
      <div className="container mx-auto px-4 pb-12">
        <h3 className="font-display text-2xl font-bold mb-4">Your deliveries</h3>
        {history.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No deliveries yet. Make your first drop above!</Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {history.map((d) => (
              <Link key={d.id} to="/track/$id" params={{ id: d.id }}>
                <Card className="p-4 hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <StatusBadge status={d.status} />
                        <span className="text-muted-foreground">{d.delivery_type === "drone" ? "🚁 Drone" : "🛵 Courier"}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium truncate">{d.pickup_address} → {d.dropoff_address}</p>
                      <p className="text-xs text-muted-foreground mt-1">{d.distance_km} km · {d.package_size}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl font-bold">${Number(d.price).toFixed(2)}</div>
                      {d.status === "delivered" && <Star className="h-4 w-4 text-primary inline" />}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Searching", className: "bg-warning text-warning-foreground" },
    accepted: { label: "Accepted", className: "bg-primary text-primary-foreground" },
    picked_up: { label: "Picked up", className: "bg-primary text-primary-foreground" },
    in_transit: { label: "In transit", className: "bg-primary text-primary-foreground" },
    delivered: { label: "Delivered", className: "bg-success text-success-foreground" },
    cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
  };
  const v = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge className={v.className}>{v.label}</Badge>;
}
