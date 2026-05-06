import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart — SwiftDrop" }] }),
  component: CartPage,
});

const checkoutSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(3).max(300),
  notes: z.string().max(500).optional(),
});

function CartPage() {
  const { items, storeId, storeName, subtotal, updateQty, removeItem, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  // Load delivery fee for the store in cart
  useState(() => {
    if (!storeId) return;
    supabase.from("stores").select("delivery_fee").eq("id", storeId).single().then(({ data }) => {
      if (data) setDeliveryFee(Number((data as { delivery_fee: number }).delivery_fee));
    });
  });

  const total = subtotal + deliveryFee;

  const placeOrder = async () => {
    if (!user) { navigate({ to: "/auth", search: { mode: "login" } as never }); return; }
    if (!storeId || items.length === 0) { toast.error("Your cart is empty"); return; }
    const parsed = checkoutSchema.safeParse({ name, phone, address, notes: notes || undefined });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setSubmitting(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        customer_id: user.id,
        store_id: storeId,
        status: "pending_confirmation",
        payment_status: "unpaid",
        subtotal,
        delivery_fee: deliveryFee,
        total,
        customer_name: parsed.data.name,
        customer_phone: parsed.data.phone,
        delivery_address: parsed.data.address,
        notes: parsed.data.notes,
      }).select("id").single();
      if (error) throw error;

      const orderId = (order as { id: string }).id;
      const lineItems = items.map((i) => ({
        order_id: orderId,
        menu_item_id: i.id,
        name: i.name,
        unit_price: i.price,
        quantity: i.quantity,
        line_total: i.price * i.quantity,
      }));
      const { error: e2 } = await supabase.from("order_items").insert(lineItems);
      if (e2) throw e2;

      toast.success("Order placed! Awaiting store confirmation.");
      clear();
      navigate({ to: "/orders/$id", params: { id: orderId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="h-20 w-20 mx-auto rounded-full bg-muted flex items-center justify-center"><ShoppingBag className="h-10 w-10 text-muted-foreground" /></div>
          <h1 className="mt-6 font-display text-3xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground mt-2">Browse stores and add some items.</p>
          <Link to="/shop"><Button variant="hero" size="lg" className="mt-6">Browse stores</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-[1fr_400px] gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-3xl font-bold">Your cart</h1>
            <span className="text-sm text-muted-foreground">From <span className="font-semibold text-foreground">{storeName}</span></span>
          </div>
          <div className="space-y-3">
            {items.map((i) => (
              <Card key={i.id} className="p-4 flex gap-3 items-center">
                {i.image_url && <img src={i.image_url} alt={i.name} className="h-16 w-16 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{i.name}</h3>
                  <p className="text-sm text-muted-foreground">${i.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(i.id, i.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                  <span className="w-6 text-center font-semibold">{i.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(i.id, i.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                </div>
                <div className="w-20 text-right font-display font-bold">${(i.price * i.quantity).toFixed(2)}</div>
                <Button variant="ghost" size="icon" onClick={() => removeItem(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-6 h-fit lg:sticky lg:top-20">
          <h2 className="font-display text-2xl font-bold">Checkout</h2>
          <div className="mt-4 space-y-3">
            <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 700 000 000" /></div>
            <div><Label>Delivery address</Label><Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Apt 4B" rows={2} /></div>
            <div><Label>Notes (optional)</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ring twice…" rows={2} /></div>
          </div>

          <div className="mt-5 rounded-xl bg-secondary text-secondary-foreground p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="opacity-70">Subtotal (prepaid)</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="opacity-70">Delivery fee (cash)</span><span className="font-semibold">${deliveryFee.toFixed(2)}</span></div>
            <div className="border-t border-secondary-foreground/20 pt-2 flex justify-between items-baseline">
              <span className="text-xs opacity-70">Total</span>
              <span className="font-display text-3xl font-bold text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            Items will be prepaid after the store confirms availability. Pay <strong className="text-foreground">${deliveryFee.toFixed(2)} in cash</strong> to the rider on delivery.
          </p>

          <Button variant="hero" size="lg" className="w-full mt-4" onClick={placeOrder} disabled={submitting}>
            {submitting ? "Placing order…" : "Place order"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
