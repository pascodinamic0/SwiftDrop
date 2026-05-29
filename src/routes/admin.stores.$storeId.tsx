import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminEmptyState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/AdminPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, MapPin, Package, Store } from "lucide-react";
import { toast } from "sonner";
import type { StoreCategoryId } from "@/lib/store-categories";
import { STORE_CATEGORY_META } from "@/lib/store-categories";
import { getStoreCategoryLabel } from "@/lib/store-categories-i18n";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/stores/$storeId")({
  component: AdminStoreProducts,
});

interface StoreRow {
  id: string;
  name: string;
  description: string | null;
  category: StoreCategoryId;
  address: string;
  delivery_fee: number;
  is_open: boolean;
  mode: string;
  image_url: string | null;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  category_id: string | null;
}

function AdminStoreProducts() {
  const { t } = useTranslation();
  const { storeId } = Route.useParams();
  const [store, setStore] = useState<StoreRow | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [s, c, i] = await Promise.all([
      supabase.from("stores").select("*").eq("id", storeId).single(),
      supabase
        .from("menu_categories")
        .select("*")
        .eq("store_id", storeId)
        .order("sort_order")
        .order("name"),
      supabase.from("menu_items").select("*").eq("store_id", storeId).order("name"),
    ]);
    setStore(s.data as StoreRow | null);
    setCategories((c.data ?? []) as Category[]);
    setItems((i.data ?? []) as MenuItem[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [storeId]);

  const categoryLabel = (categoryId: string | null) =>
    categories.find((c) => c.id === categoryId)?.name ?? t("vendor.uncategorized");

  const grouped = useMemo(() => {
    const byCat = new Map<string, MenuItem[]>();
    const uncategorized: MenuItem[] = [];
    for (const item of items) {
      if (item.category_id) {
        const list = byCat.get(item.category_id) ?? [];
        list.push(item);
        byCat.set(item.category_id, list);
      } else {
        uncategorized.push(item);
      }
    }
    const sections: { id: string; name: string; items: MenuItem[] }[] = categories
      .map((c) => ({ id: c.id, name: c.name, items: byCat.get(c.id) ?? [] }))
      .filter((s) => s.items.length > 0);
    if (uncategorized.length > 0) {
      sections.push({ id: "__none", name: t("vendor.uncategorized"), items: uncategorized });
    }
    return sections;
  }, [items, categories, t]);

  const toggleAvail = async (id: string, v: boolean) => {
    const { error } = await supabase.from("menu_items").update({ is_available: v }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  if (loading) {
    return (
      <AdminPage>
        <p className="text-center text-muted-foreground py-16">{t("common.loading")}</p>
      </AdminPage>
    );
  }

  if (!store) {
    return (
      <AdminPage>
        <AdminEmptyState icon={Store} title={t("admin.storeNotFound")} />
        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline">
            <Link to="/admin/stores">
              <ArrowLeft className="h-4 w-4" />
              {t("admin.backToStores")}
            </Link>
          </Button>
        </div>
      </AdminPage>
    );
  }

  const CatIcon = STORE_CATEGORY_META[store.category]?.Icon ?? Store;
  const availableCount = items.filter((i) => i.is_available).length;

  return (
    <AdminPage className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 shrink-0">
          <Link to="/admin/stores">
            <ArrowLeft className="h-4 w-4" />
            {t("admin.backToStores")}
          </Link>
        </Button>
      </div>

      <AdminPageHeader
        title={store.name}
        description={store.description ?? store.address}
        badge={
          <>
            <Badge variant="outline">{getStoreCategoryLabel(store.category, t)}</Badge>
            <Badge variant={store.is_open ? "default" : "secondary"}>
              {store.is_open ? t("common.open") : t("common.closed")}
            </Badge>
            <Badge variant="secondary">
              {t("admin.productsCount", { count: items.length })}
            </Badge>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
            {store.image_url ? (
              <img src={store.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                <CatIcon className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="flex items-start gap-1 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{store.address}</span>
            </p>
            <p className="text-sm font-medium">
              {t("admin.deliveryFeeLabel", { fee: Number(store.delivery_fee).toFixed(2) })}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{store.mode}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("vendor.allItems", { count: items.length })}
          </p>
          <p className="mt-1 font-display text-2xl font-bold">{availableCount}</p>
          <p className="text-xs text-muted-foreground">{t("common.open")}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("vendor.categories")}
          </p>
          <p className="mt-1 font-display text-2xl font-bold">{categories.length}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <AdminEmptyState
          icon={Package}
          title={t("admin.productsTitle")}
          description={t("admin.noProducts")}
        />
      ) : grouped.length > 0 ? (
        <div className="space-y-6">
          {grouped.map((section) => (
            <AdminPanel key={section.id} title={section.name} contentClassName="p-0 sm:p-0">
              <ul className="divide-y divide-border/60">
                {section.items.map((it) => (
                  <li
                    key={it.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {it.image_url ? (
                        <img
                          src={it.image_url}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{it.name}</p>
                          {!it.is_available && (
                            <Badge variant="secondary" className="text-[10px]">
                              {t("admin.unavailable")}
                            </Badge>
                          )}
                        </div>
                        {it.description && (
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                            {it.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {categoryLabel(it.category_id)}
                        </p>
                      </div>
                    </div>
                    <div className="flex w-full shrink-0 items-center justify-between gap-3 border-t border-border/60 pt-3 sm:w-auto sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      <p className="font-display text-lg font-bold">
                        ${Number(it.price).toFixed(2)}
                      </p>
                      <label className="flex items-center gap-2 text-xs font-medium">
                        {t("vendor.avail")}
                        <Switch
                          checked={it.is_available}
                          onCheckedChange={(v) => toggleAvail(it.id, v)}
                        />
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            </AdminPanel>
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-border/60 rounded-xl border border-border/80 bg-card/95 shadow-card">
          {items.map((it) => (
            <li
              key={it.id}
              className={cn(
                "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5",
                !it.is_available && "opacity-75",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <p className="font-semibold">{it.name}</p>
                <span className="font-display font-bold">${Number(it.price).toFixed(2)}</span>
              </div>
              <label className="flex items-center gap-2 text-xs">
                {t("vendor.avail")}
                <Switch checked={it.is_available} onCheckedChange={(v) => toggleAvail(it.id, v)} />
              </label>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
