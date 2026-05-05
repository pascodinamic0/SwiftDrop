import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { DeliveryMap, type LatLng } from "@/components/DeliveryMap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "./customer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Star, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/track/$id")({
  head: () => ({ meta: [{ title: "Track delivery — SwiftDrop" }] }),
  component: () => <RequireAuth><Track /></RequireAuth>,
});

interface DeliveryFull {
  id: string; status: string; price: number; distance_km: number;
  pickup_address: string; dropoff_address: string;
  pickup_lat: number; pickup_lng: number; dropoff_lat: number; dropoff_lng: number;
  delivery_type: string; package_size: string;
  customer_id: string; agent_id: string | null;
}

function Track() {
  const { id } = useParams({ from: "/track/$id" });
  const { user } = useAuth();
  const [d, setD] = useState<DeliveryFull | null>(null);
  const [agentLoc, setAgentLoc] = useState<LatLng | null>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [hasRated, setHasRated] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("deliveries").select("*").eq("id", id).maybeSingle();
    if (data) setD(data as DeliveryFull);
    if (data?.agent_id) {
      const { data: ap } = await supabase.from("agent_profiles").select("current_lat,current_lng").eq("id", data.agent_id).maybeSingle();
      if (ap?.current_lat && ap?.current_lng) setAgentLoc({ lat: ap.current_lat, lng: ap.current_lng });
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", data.agent_id).maybeSingle();
      if (prof) setAgentName(prof.full_name ?? "Your courier");
    }
    const { data: r } = await supabase.from("ratings").select("id").eq("delivery_id", id).maybeSingle();
    setHasRated(!!r);
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    const ch = supabase.channel(`track-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries", filter: `id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_profiles" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const submitRating = async () => {
    if (!d || !user || !d.agent_id) return;
    const { error } = await supabase.from("ratings").insert({
      delivery_id: d.id, customer_id: user.id, agent_id: d.agent_id, stars, comment,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks for rating!");
    setHasRated(true);
  };

  if (!d) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-6">
        <Link to="/customer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="rounded-2xl overflow-hidden h-[60vh] lg:h-[70vh]">
            <DeliveryMap
              pickup={{ lat: d.pickup_lat, lng: d.pickup_lng }}
              dropoff={{ lat: d.dropoff_lat, lng: d.dropoff_lng }}
              agent={agentLoc}
              isDrone={d.delivery_type === "drone"}
              height="100%"
            />
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <StatusBadge status={d.status} />
              <h2 className="font-display text-2xl font-bold mt-3">
                {d.status === "delivered" ? "Delivered!" :
                 d.status === "pending" ? "Searching for an agent…" :
                 d.status === "accepted" ? "Agent on the way to pickup" :
                 d.status === "picked_up" ? "Package picked up" :
                 d.status === "in_transit" ? "On the way to you" : d.status}
              </h2>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="From" value={d.pickup_address} />
                <Row label="To" value={d.dropoff_address} />
                <Row label="Distance" value={`${d.distance_km} km`} />
                <Row label="Type" value={d.delivery_type === "drone" ? "🚁 Drone" : "🛵 Courier"} />
                <Row label="Size" value={d.package_size} />
                {agentName && <Row label="Agent" value={agentName} />}
                <div className="border-t border-border pt-3 mt-3 flex justify-between items-baseline">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-display text-2xl font-bold">${Number(d.price).toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {d.status === "delivered" && d.customer_id === user?.id && !hasRated && d.agent_id && (
              <Card className="p-5">
                <h3 className="font-display text-lg font-semibold">Rate your courier</h3>
                <div className="flex gap-1 mt-3">
                  {[1,2,3,4,5].map((n) => (
                    <button key={n} onClick={() => setStars(n)}>
                      <Star className={`h-8 w-8 ${n <= stars ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment" rows={2} className="mt-3" />
                <Button variant="hero" className="w-full mt-3" onClick={submitRating}>Submit rating</Button>
              </Card>
            )}
            {hasRated && d.status === "delivered" && (
              <Card className="p-5 text-center text-sm text-muted-foreground">Thanks for your feedback! ⭐</Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  );
}
