import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Package, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/rider/active")({
  component: ActiveDelivery,
});

interface ActiveOrder {
  id: string; status: string; delivery_fee: number; subtotal: number; total: number;
  customer_name: string; customer_phone: string; delivery_address: string; notes: string | null;
  store_id: string; created_at: string;
}
interface StoreLite { name: string; address: string; contact_phone: string | null; }

function ActiveDelivery() {
  const { user } = useAuth();
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [store, setStore] = useState<StoreLite | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("orders").select("*")
      .eq("rider_id", user.id)
      .in("status", ["picked_up"])
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (data) {
      setOrder(data as ActiveOrder);
      const { data: s } = await supabase.from("stores").select("name,address,contact_phone").eq("id", (data as ActiveOrder).store_id).single();
      setStore(s as StoreLite | null);
    } else { setOrder(null); setStore(null); }
  };

  useEffect(() => { load(); }, [user]);
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`rider-active-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `rider_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const markDelivered = async () => {
    if (!order) return;
    const { error } = await supabase.from("orders").update({
      status: "delivered",
      delivered_at: new Date().toISOString(),
      cash_collected: order.delivery_fee,
    }).eq("id", order.id);
    if (error) return toast.error(error.message);
    toast.success(`Delivered! +$${Number(order.delivery_fee).toFixed(2)}`);
  };

  if (!order) {
    return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
      <Package className="h-12 w-12 mx-auto opacity-30 mb-3" />
      <p>No active delivery.</p>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Badge className="bg-primary text-primary-foreground">Active delivery</Badge>
      <h1 className="font-display text-2xl font-bold mt-2">Order #{order.id.slice(0, 8)}</h1>

      <Card className="mt-4 p-5">
        <h3 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Pickup</h3>
        <p className="mt-1 text-sm">{store?.name}</p>
        <p className="text-sm text-muted-foreground">{store?.address}</p>
        {store?.contact_phone && (
          <a href={`tel:${store.contact_phone}`} className="mt-2 inline-flex items-center gap-1 text-sm text-primary font-semibold"><Phone className="h-3 w-3" />{store.contact_phone}</a>
        )}
      </Card>

      <Card className="mt-3 p-5">
        <h3 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-secondary" /> Drop-off</h3>
        <p className="mt-1 text-sm font-medium">{order.customer_name}</p>
        <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
        <a href={`tel:${order.customer_phone}`} className="mt-2 inline-flex items-center gap-1 text-sm text-primary font-semibold"><Phone className="h-3 w-3" />{order.customer_phone}</a>
        {order.notes && <p className="mt-2 text-xs italic text-muted-foreground">"{order.notes}"</p>}
      </Card>

      <Card className="mt-3 p-5 bg-secondary text-secondary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-70">Cash to collect on delivery</p>
            <p className="font-display text-3xl font-bold text-primary">${Number(order.delivery_fee).toFixed(2)}</p>
          </div>
          <div className="text-right text-xs opacity-70">
            <p>Items prepaid</p>
            <p>${Number(order.subtotal).toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <Button variant="hero" size="lg" className="w-full mt-4" onClick={markDelivered}>
        <CheckCircle className="h-5 w-5" /> Mark as delivered & collect cash
      </Button>
    </div>
  );
}
