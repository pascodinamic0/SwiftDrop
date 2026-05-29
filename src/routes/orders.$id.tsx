import { createFileRoute, useParams, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BlockDeliveryAgents } from "@/components/BlockDeliveryAgents";
import { RequireRole } from "@/components/RoleRouter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Check, CreditCard, X } from "lucide-react";
import { toast } from "sonner";
import { isStripeConfigured, payOrderSubtotal } from "@/lib/payments";

export const Route = createFileRoute("/orders/$id")({
  component: () => (
    <BlockDeliveryAgents>
      <RequireRole role="customer">
        <OrderTracking />
      </RequireRole>
    </BlockDeliveryAgents>
  ),
});

interface Order {
  id: string;
  customer_id: string;
  status: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  notes: string | null;
  store_id: string;
  rider_id: string | null;
  created_at: string;
  rejection_reason: string | null;
}
interface OrderItem {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}
interface StoreLite {
  name: string;
  contact_phone: string | null;
  address: string;
}

const STEPS = [
  "pending_confirmation",
  "awaiting_payment",
  "preparing",
  "ready",
  "picked_up",
  "delivered",
];

function OrderTracking() {
  const { id } = useParams({ from: "/orders/$id" });
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [store, setStore] = useState<StoreLite | null>(null);

  const load = async () => {
    const { data: o, error } = await supabase.from("orders").select("*").eq("id", id).single();
    if (error || !o) {
      setAccessDenied(true);
      return;
    }
    const row = o as Order & { customer_id: string };
    if (user && row.customer_id !== user.id && !roles.includes("admin")) {
      setAccessDenied(true);
      return;
    }
    if (o) {
      setOrder(row);
      const [it, st] = await Promise.all([
        supabase.from("order_items").select("*").eq("order_id", id),
        supabase
          .from("stores")
          .select("name,contact_phone,address")
          .eq("id", (o as Order).store_id)
          .single(),
      ]);
      setItems((it.data ?? []) as OrderItem[]);
      setStore(st.data as StoreLite | null);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    const ch = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id]);

  if (accessDenied) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 p-12 text-center">
          <h1 className="font-display text-2xl font-bold">Order not found</h1>
          <p className="text-muted-foreground mt-2">You do not have access to this order.</p>
          <Button variant="hero" className="mt-6" onClick={() => navigate({ to: "/orders" })}>
            Back to orders
          </Button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!order || !user)
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 p-12 text-center text-muted-foreground">Loading…</div>
        <SiteFooter />
      </div>
    );

  const stepIdx = STEPS.indexOf(order.status);
  const isCancelled = ["cancelled", "rejected", "failed"].includes(order.status);
  const canCancel = ["pending_confirmation", "awaiting_payment"].includes(order.status);

  const payNow = async () => {
    const subtotalCents = Math.round(Number(order.subtotal) * 100);
    const result = await payOrderSubtotal(id, subtotalCents);

    if (result.mode === "stripe" && result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }
    if (result.mode === "error") {
      toast.error(result.message);
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "paid", status: "preparing", paid_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(
      isStripeConfigured()
        ? "Payment recorded — store is preparing your order"
        : "Mock payment ✓ — Store is preparing your order",
    );
  };

  const cancel = async () => {
    if (!confirm("Cancel this order?")) return;
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order cancelled");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground">
          ← All orders
        </Link>
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold">Order #{order.id.slice(0, 8)}</h1>
            <p className="text-sm text-muted-foreground">
              {store?.name} · {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Progress */}
        {!isCancelled && (
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between gap-1">
              {STEPS.map((s, idx) => (
                <div key={s} className="flex-1 flex items-center">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${idx <= stepIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {idx < stepIdx ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-1 ${idx < stepIdx ? "bg-primary" : "bg-muted"}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1 text-[10px] text-muted-foreground text-center">
              {["Confirm", "Payment", "Preparing", "Ready", "Picked up", "Delivered"].map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          </Card>
        )}

        {order.status === "rejected" && order.rejection_reason && (
          <Card className="mt-4 p-4 border-destructive bg-destructive/5">
            <p className="text-sm">
              <strong>Store rejected:</strong> {order.rejection_reason}
            </p>
          </Card>
        )}

        {/* Pay button */}
        {order.status === "awaiting_payment" && order.payment_status === "unpaid" && (
          <Card className="mt-4 p-5 border-primary bg-primary/5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-semibold">Store confirmed your order!</h3>
                <p className="text-sm text-muted-foreground">
                  Complete payment to start preparation.
                </p>
              </div>
              <Button variant="hero" size="lg" onClick={payNow}>
                <CreditCard className="h-4 w-4" /> Pay ${order.subtotal.toFixed(2)}
                {!isStripeConfigured() ? " (mock)" : ""}
              </Button>
            </div>
          </Card>
        )}

        {/* Items */}
        <Card className="mt-4 p-5">
          <h3 className="font-semibold mb-3">Items</h3>
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span>
                  {it.quantity}× {it.name}
                </span>
                <span className="font-mono">${Number(it.line_total).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal (prepaid)</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery (cash)</span>
              <span>${Number(order.delivery_fee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-display text-lg font-bold">
              <span>Total</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card className="mt-4 p-5">
          <h3 className="font-semibold mb-2">Delivery</h3>
          <p className="text-sm">
            {order.customer_name} · {order.customer_phone}
          </p>
          <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
          {order.notes && (
            <p className="text-xs text-muted-foreground mt-2 italic">Note: {order.notes}</p>
          )}
        </Card>

        {canCancel && (
          <Button variant="outline" className="mt-4" onClick={cancel}>
            <X className="h-4 w-4" /> Cancel order
          </Button>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
