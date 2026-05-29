import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BlockDeliveryAgents } from "@/components/BlockDeliveryAgents";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart";
import { Plus, MapPin, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { getStoreCategoryLabel } from "@/lib/store-categories-i18n";
import { useTranslation } from "@/i18n";

export const Route = createFileRoute("/shop/$storeId")({
  component: () => (
    <BlockDeliveryAgents>
      <StorePage />
    </BlockDeliveryAgents>
  ),
});

interface Store {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  address: string;
  delivery_fee: number;
  is_open: boolean;
  category: string;
}
interface Cat {
  id: string;
  name: string;
  sort_order: number;
}
interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  is_available: boolean;
}

function StorePage() {
  const { t } = useTranslation();
  const { storeId } = useParams({ from: "/shop/$storeId" });
  const [store, setStore] = useState<Store | null>(null);
  const [cats, setCats] = useState<Cat[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const { addItem, count, subtotal } = useCart();

  useEffect(() => {
    (async () => {
      const [s, c, i] = await Promise.all([
        supabase.from("stores").select("*").eq("id", storeId).single(),
        supabase.from("menu_categories").select("*").eq("store_id", storeId).order("sort_order"),
        supabase.from("menu_items").select("*").eq("store_id", storeId).eq("is_available", true),
      ]);
      setStore(s.data as Store | null);
      setCats((c.data ?? []) as Cat[]);
      setItems((i.data ?? []) as Item[]);
    })();
  }, [storeId]);

  if (!store)
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 p-12 text-center text-muted-foreground">{t("common.loading")}</div>
        <SiteFooter />
      </div>
    );

  const handleAdd = (it: Item) => {
    if (!store.is_open) {
      toast.error(t("shop.storeClosed"));
      return;
    }
    addItem(store.id, store.name, {
      id: it.id,
      name: it.name,
      price: Number(it.price),
      image_url: it.image_url,
    });
    toast.success(t("shop.addedItem", { name: it.name }));
  };

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <SiteHeader />
      <div className="flex-1">
        <div className="relative h-48 md:h-64 bg-muted overflow-hidden">
          {store.image_url && (
            <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent" />
        </div>
        <div className="container mx-auto px-4 -mt-20 relative">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <Badge className="mb-2">{getStoreCategoryLabel(store.category, t)}</Badge>
                <h1 className="font-display text-3xl md:text-4xl font-bold">{store.name}</h1>
                <p className="text-muted-foreground mt-1">{store.description}</p>
                <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {store.address}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">{t("shop.deliveryFeeCash")}</div>
                <div className="font-display text-2xl font-bold">
                  ${Number(store.delivery_fee).toFixed(2)}
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-8 space-y-8">
            {cats.map((cat) => {
              const list = items.filter((i) => i.category_id === cat.id);
              if (list.length === 0) return null;
              return (
                <div key={cat.id}>
                  <h2 className="font-display text-2xl font-bold mb-3">{cat.name}</h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {list.map((it) => (
                      <Card key={it.id} className="p-4 flex gap-4 hover:shadow-card transition-all">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{it.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {it.description}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-display text-lg font-bold">
                              ${Number(it.price).toFixed(2)}
                            </span>
                            <Button size="sm" variant="hero" onClick={() => handleAdd(it)}>
                              <Plus className="h-4 w-4" /> {t("common.add")}
                            </Button>
                          </div>
                        </div>
                        {it.image_url && (
                          <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                            <img
                              src={it.image_url}
                              alt={it.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SiteFooter />

      {count > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-30 px-4">
          <div className="container mx-auto">
            <Link to="/cart">
              <Button variant="hero" size="lg" className="w-full justify-between shadow-glow">
                <span className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />{" "}
                  {count > 1
                    ? t("shop.inCartPlural", { count })
                    : t("shop.inCart", { count })}
                </span>
                <span className="font-display text-xl">${subtotal.toFixed(2)}</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
