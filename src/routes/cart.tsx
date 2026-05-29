import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/i18n";
import type { TFunction } from "@/i18n/translate";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BlockDeliveryAgents } from "@/components/BlockDeliveryAgents";
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
  component: () => (
    <BlockDeliveryAgents>
      <CartPage />
    </BlockDeliveryAgents>
  ),
});

function checkoutSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t("rider.validation.fullName")).max(100),
    phone: z.string().trim().min(7, t("rider.validation.phone")).max(20),
    address: z.string().trim().min(3, t("rider.validation.address")).max(300),
    notes: z.string().max(500).optional(),
  });
}

function CartPage() {
  const { t } = useTranslation();
  const schema = useMemo(() => checkoutSchema(t), [t]);
  const { items, storeId, storeName, subtotal, updateQty, removeItem, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  useEffect(() => {
    if (!storeId) {
      setDeliveryFee(0);
      return;
    }
    let cancelled = false;
    supabase
      .from("stores")
      .select("delivery_fee")
      .eq("id", storeId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) {
          setDeliveryFee(Number((data as { delivery_fee: number }).delivery_fee));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const total = subtotal + deliveryFee;

  const placeOrder = async () => {
    if (!user) {
      navigate({ to: "/auth", search: { mode: "login" } as never });
      return;
    }
    if (!storeId || items.length === 0) {
      toast.error(t("cart.emptyToast"));
      return;
    }
    const parsed = schema.safeParse({ name, phone, address, notes: notes || undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
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
        })
        .select("id")
        .single();
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

      toast.success(t("cart.orderPlaced"));
      clear();
      navigate({ to: "/orders/$id", params: { id: orderId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("cart.orderFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 container mx-auto px-4 py-16 text-center">
          <div className="h-20 w-20 mx-auto rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold">{t("cart.emptyTitle")}</h1>
          <p className="text-muted-foreground mt-2">{t("cart.emptyDesc")}</p>
          <Link to="/shop">
            <Button variant="hero" size="lg" className="mt-6">
              {t("order.browseStores")}
            </Button>
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 container mx-auto px-4 py-8 grid lg:grid-cols-[1fr_400px] gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-3xl font-bold">{t("cart.title")}</h1>
            <span className="text-sm text-muted-foreground">
              {t("cart.fromStore", { name: storeName ?? "" })}
            </span>
          </div>
          <div className="space-y-3">
            {items.map((i) => (
              <Card key={i.id} className="p-4 flex gap-3 items-center">
                {i.image_url && (
                  <img
                    src={i.image_url}
                    alt={i.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{i.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("cart.each", { price: i.price.toFixed(2) })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQty(i.id, i.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center font-semibold">{i.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQty(i.id, i.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="w-20 text-right font-display font-bold">
                  ${(i.price * i.quantity).toFixed(2)}
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeItem(i.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-6 h-fit lg:sticky lg:top-20">
          <h2 className="font-display text-2xl font-bold">{t("cart.checkout")}</h2>
          <div className="mt-4 space-y-3">
            <div>
              <Label>{t("cart.fullName")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("cart.placeholderName")}
              />
            </div>
            <div>
              <Label>{t("cart.phone")}</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("cart.placeholderPhone")}
              />
            </div>
            <div>
              <Label>{t("cart.address")}</Label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("cart.placeholderAddress")}
                rows={2}
              />
            </div>
            <div>
              <Label>{t("cart.notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("cart.placeholderNotes")}
                rows={2}
              />
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-secondary text-secondary-foreground p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="opacity-70">{t("cart.subtotal")}</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-70">{t("cart.deliveryFee")}</span>
              <span className="font-semibold">${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-secondary-foreground/20 pt-2 flex justify-between items-baseline">
              <span className="text-xs opacity-70">{t("cart.total")}</span>
              <span className="font-display text-3xl font-bold text-primary">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            {t("cart.paymentNote", { fee: `$${deliveryFee.toFixed(2)}` })}
          </p>

          <Button
            variant="hero"
            size="lg"
            className="w-full mt-4"
            onClick={placeOrder}
            disabled={submitting}
          >
            {submitting ? t("common.placingOrder") : t("cart.placeOrder")}
          </Button>
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
