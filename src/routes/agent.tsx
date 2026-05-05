import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { DeliveryMap, type LatLng } from "@/components/DeliveryMap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "./customer";
import { distanceKm } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { DollarSign, Package as PackageIcon, Star, MapPin } from "lucide-react";

export const Route = createFileRoute("/agent")({
  head: () => ({ meta: [{ title: "Agent dashboard — SwiftDrop" }] }),
  component: () => <RequireAuth role="delivery_agent"><AgentDash /></RequireAuth>,
});

interface Job {
  id: string; pickup_address: string; dropoff_address: string;
  pickup_lat: number; pickup_lng: number; dropoff_lat: number; dropoff_lng: number;
  status: string; price: number; distance_km: number; delivery_type: string;
  package_size: string; agent_id: string | null; customer_id: string;
}

function AgentDash() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [online, setOnline] = useState(false);
  const [location, setLocation] = useState<LatLng>({ lat: 40.7128, lng: -74.006 });
  const [stats, setStats] = useState({ earnings: 0, deliveries: 0, avg: 0 });
  const [pending, setPending] = useState<Job[]>([]);
  const [active, setActive] = useState<Job | null>(null);

  // Load my agent profile + stats
  const loadProfile = async () => {
    if (!user) return;
    const { data: ap } = await supabase.from("agent_profiles").select("*").eq("id", user.id).maybeSingle();
    if (ap) {
      setOnline(!!ap.is_online);
      if (ap.current_lat && ap.current_lng) setLocation({ lat: ap.current_lat, lng: ap.current_lng });
      setStats((s) => ({ ...s, earnings: Number(ap.total_earnings), deliveries: ap.total_deliveries }));
    } else {
      // create profile if missing
      await supabase.from("agent_profiles").upsert({ id: user.id, vehicle: "bike", is_online: false });
    }
    const { data: prof } = await supabase.from("profiles").select("avg_rating").eq("id", user.id).maybeSingle();
    if (prof) setStats((s) => ({ ...s, avg: Number(prof.avg_rating ?? 0) }));
  };

  const loadJobs = async () => {
    if (!user) return;
    // active = mine, not delivered/cancelled
    const { data: mine } = await supabase
      .from("deliveries").select("*")
      .eq("agent_id", user.id)
      .in("status", ["accepted", "picked_up", "in_transit"])
      .order("accepted_at", { ascending: false }).limit(1);
    setActive((mine?.[0] as Job) ?? null);

    // available pending
    const { data: avail } = await supabase
      .from("deliveries").select("*")
      .eq("status", "pending")
      .is("agent_id", null)
      .order("created_at", { ascending: false }).limit(10);
    setPending((avail ?? []) as Job[]);
  };

  useEffect(() => { loadProfile(); loadJobs(); }, [user]);

  // realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`agent-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, loadJobs)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // simulate live position update for active job
  useEffect(() => {
    if (!active || !user) return;
    const target = active.status === "accepted"
      ? { lat: active.pickup_lat, lng: active.pickup_lng }
      : { lat: active.dropoff_lat, lng: active.dropoff_lng };
    const id = setInterval(async () => {
      setLocation((cur) => {
        const next = { lat: cur.lat + (target.lat - cur.lat) * 0.08, lng: cur.lng + (target.lng - cur.lng) * 0.08 };
        supabase.from("agent_profiles").update({ current_lat: next.lat, current_lng: next.lng }).eq("id", user.id);
        return next;
      });
    }, 1500);
    return () => clearInterval(id);
  }, [active, user]);

  const toggleOnline = async (val: boolean) => {
    setOnline(val);
    if (!user) return;
    await supabase.from("agent_profiles").update({ is_online: val, current_lat: location.lat, current_lng: location.lng }).eq("id", user.id);
    toast.success(val ? "You're online — receiving jobs" : "You're offline");
  };

  const acceptJob = async (job: Job) => {
    if (!user) return;
    const { error } = await supabase.from("deliveries").update({
      agent_id: user.id, status: "accepted", accepted_at: new Date().toISOString(),
    }).eq("id", job.id).eq("status", "pending");
    if (error) { toast.error(error.message); return; }
    toast.success("Job accepted! Head to pickup.");
    loadJobs();
  };

  const advanceStatus = async () => {
    if (!active) return;
    const next: Record<string, string> = { accepted: "picked_up", picked_up: "in_transit", in_transit: "delivered" };
    const newStatus = next[active.status];
    if (!newStatus) return;
    const update: Record<string, unknown> = { status: newStatus };
    if (newStatus === "delivered") update.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("deliveries").update(update).eq("id", active.id);
    if (error) { toast.error(error.message); return; }
    toast.success(newStatus === "delivered" ? "Delivered! 🎉" : `Status: ${newStatus.replace("_", " ")}`);
    loadJobs();
  };

  const sortedPending = pending
    .map((j) => ({ ...j, dist: distanceKm(location, { lat: j.pickup_lat, lng: j.pickup_lng }) }))
    .sort((a, b) => a.dist - b.dist);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8">
        {/* Top status row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className={`relative h-3 w-3 rounded-full ${online ? "bg-success" : "bg-muted-foreground"}`}>
              {online && <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-60" />}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">{online ? "You're online" : "You're offline"}</h1>
              <p className="text-xs text-muted-foreground">Toggle availability to receive nearby jobs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Available</span>
            <Switch checked={online} onCheckedChange={toggleOnline} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard icon={DollarSign} label="Earnings" value={`$${stats.earnings.toFixed(2)}`} />
          <StatCard icon={PackageIcon} label="Deliveries" value={stats.deliveries.toString()} />
          <StatCard icon={Star} label="Rating" value={stats.avg ? stats.avg.toFixed(1) : "—"} />
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          <div className="rounded-2xl overflow-hidden h-[500px]">
            <DeliveryMap
              pickup={active ? { lat: active.pickup_lat, lng: active.pickup_lng } : null}
              dropoff={active ? { lat: active.dropoff_lat, lng: active.dropoff_lng } : null}
              agent={location}
              isDrone={active?.delivery_type === "drone"}
              height="100%"
            />
          </div>

          <div className="space-y-4">
            {active ? (
              <Card className="p-5 border-primary border-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Active job</div>
                    <StatusBadge status={active.status} />
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-bold">${Number(active.price).toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex gap-2"><MapPin className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" /><span className="font-medium truncate">{active.pickup_address}</span></div>
                  <div className="flex gap-2"><MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" /><span className="font-medium truncate">{active.dropoff_address}</span></div>
                </div>
                <Button variant="hero" size="lg" className="w-full mt-4" onClick={advanceStatus}>
                  {active.status === "accepted" && "Confirm pickup"}
                  {active.status === "picked_up" && "Start transit"}
                  {active.status === "in_transit" && "Mark delivered"}
                </Button>
              </Card>
            ) : !online ? (
              <Card className="p-8 text-center text-muted-foreground">Go online to see nearby jobs.</Card>
            ) : sortedPending.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                  <PackageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No jobs nearby. Hang tight.</p>
              </Card>
            ) : (
              <>
                <h3 className="font-display text-lg font-semibold">Nearby jobs</h3>
                {sortedPending.map((j) => (
                  <Card key={j.id} className="p-4 hover:border-primary transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs text-muted-foreground">
                        {j.dist.toFixed(2)} km away · {j.delivery_type === "drone" ? "🚁" : "🛵"}
                      </div>
                      <div className="font-display text-xl font-bold text-primary">${Number(j.price).toFixed(2)}</div>
                    </div>
                    <p className="text-sm font-medium truncate">{j.pickup_address}</p>
                    <p className="text-xs text-muted-foreground truncate">→ {j.dropoff_address}</p>
                    <Button variant="hero" size="sm" className="w-full mt-3" onClick={() => acceptJob(j)}>Accept job</Button>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
    </Card>
  );
}
