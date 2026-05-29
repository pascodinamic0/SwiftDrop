import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BlockDeliveryAgents } from "@/components/BlockDeliveryAgents";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STORE_CATEGORY_META,
  STORE_CATEGORY_ORDER,
  type StoreCategoryId,
  isStoreCategoryId,
} from "@/lib/store-categories";
import { getStoreCategoryLabel, getStoreCategoryMeta } from "@/lib/store-categories-i18n";
import { useTranslation } from "@/i18n";
import type { TFunction } from "@/i18n/translate";
import { Clock, LayoutGrid, MapPin, Search, Sparkles, X } from "lucide-react";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "Browse stores — SwiftDrop" }] }),
  component: () => (
    <BlockDeliveryAgents>
      <Shop />
    </BlockDeliveryAgents>
  ),
});

interface StoreRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  address: string;
  delivery_fee: number;
  is_open: boolean;
  mode: string;
}

type SortKey = "recommended" | "name_asc" | "name_desc" | "fee_asc" | "fee_desc";

function sortStores(list: StoreRow[], sort: SortKey): StoreRow[] {
  const out = [...list];
  const byName = (a: StoreRow, b: StoreRow) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  const byFee = (a: StoreRow, b: StoreRow) => Number(a.delivery_fee) - Number(b.delivery_fee);
  switch (sort) {
    case "name_asc":
      return out.sort(byName);
    case "name_desc":
      return out.sort((a, b) => -byName(a, b));
    case "fee_asc":
      return out.sort(byFee);
    case "fee_desc":
      return out.sort((a, b) => -byFee(a, b));
    case "recommended":
    default:
      return out.sort((a, b) => {
        if (a.is_open !== b.is_open) return a.is_open ? -1 : 1;
        return byName(a, b);
      });
  }
}

function StoreCard({ s, t }: { s: StoreRow; t: TFunction }) {
  return (
    <Link to="/shop/$storeId" params={{ storeId: s.id }}>
      <Card className="overflow-hidden hover:-translate-y-1 hover:shadow-glow transition-all cursor-pointer h-full flex flex-col">
        <div className="aspect-video bg-muted relative overflow-hidden shrink-0">
          {s.image_url && (
            <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
          )}
          {!s.is_open && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="secondary">{t("common.closed")}</Badge>
            </div>
          )}
          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground">
            {getStoreCategoryLabel(s.category, t)}
          </Badge>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-xl font-bold leading-tight">{s.name}</h3>
            <Badge variant="outline" className="text-xs shrink-0">
              {t("shop.deliveryFee", { fee: Number(s.delivery_fee).toFixed(2) })}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 grow">{s.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 min-w-0">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{s.address}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3" /> {t("shop.eta")}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Shop() {
  const { t } = useTranslation();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | StoreCategoryId>("all");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("*").order("name");
      setStores((data ?? []) as StoreRow[]);
      setLoading(false);
    })();
  }, []);

  const counts = useMemo(() => {
    const byCat = Object.fromEntries(STORE_CATEGORY_ORDER.map((id) => [id, 0])) as Record<
      StoreCategoryId,
      number
    >;
    for (const s of stores) {
      if (isStoreCategoryId(s.category)) byCat[s.category] += 1;
      else byCat.other += 1;
    }
    return byCat;
  }, [stores]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return stores.filter((s) => {
      const catOk = cat === "all" || s.category === cat;
      const qOk =
        needle === "" ||
        s.name.toLowerCase().includes(needle) ||
        (s.description?.toLowerCase().includes(needle) ?? false) ||
        s.address.toLowerCase().includes(needle) ||
        getStoreCategoryLabel(s.category, t).toLowerCase().includes(needle);
      return catOk && qOk;
    });
  }, [stores, cat, q, t]);

  const sorted = useMemo(() => sortStores(filtered, sort), [filtered, sort]);

  const hasFilters = cat !== "all" || q.trim() !== "";

  const clearFilters = () => {
    setCat("all");
    setQ("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <header className="mb-6">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            {t("shop.title")}
          </h1>
          <p className="text-muted-foreground mt-1.5">{t("shop.subtitle")}</p>
        </header>

        <section
          className="rounded-2xl border border-border bg-card/60 p-4 md:p-5 space-y-4"
          aria-label={t("shop.searchAria")}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-10 h-11"
                placeholder={t("shop.searchPlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={t("shop.searchAria")}
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-[200px] h-11 shrink-0">
                <SelectValue placeholder={t("shop.sort")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">{t("shop.sortOpenFirst")}</SelectItem>
                <SelectItem value="name_asc">{t("shop.sortNameAsc")}</SelectItem>
                <SelectItem value="name_desc">{t("shop.sortNameDesc")}</SelectItem>
                <SelectItem value="fee_asc">{t("shop.sortFeeLow")}</SelectItem>
                <SelectItem value="fee_desc">{t("shop.sortFeeHigh")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
            <CategoryPill
              active={cat === "all"}
              onClick={() => setCat("all")}
              icon={LayoutGrid}
              label={t("shop.allStores")}
              count={stores.length}
            />
            {STORE_CATEGORY_ORDER.map((categoryId) => {
              const catMeta = getStoreCategoryMeta(categoryId, t);
              const { Icon } = STORE_CATEGORY_META[categoryId];
              const n = counts[categoryId] ?? 0;
              return (
                <CategoryPill
                  key={categoryId}
                  active={cat === categoryId}
                  onClick={() => setCat(categoryId)}
                  icon={Icon}
                  label={catMeta.shortLabel}
                  count={n}
                  dimmed={n === 0}
                />
              );
            })}
          </div>
        </section>

        {!loading && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-6 mb-4">
            <p className="text-sm text-muted-foreground">
              {hasFilters
                ? t("shop.resultsFiltered", { count: sorted.length })
                : t("shop.storesCount", { count: sorted.length })}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <X className="h-3.5 w-3.5" />
                {t("shop.clearFilters")}
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground space-y-2">
            <Sparkles className="h-10 w-10 mx-auto opacity-40" />
            <p>{t("shop.noMatch")}</p>
            {hasFilters && (
              <button
                type="button"
                className="text-primary font-semibold text-sm hover:underline"
                onClick={clearFilters}
              >
                {t("shop.clearFilters")}
              </button>
            )}
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((s) => (
              <StoreCard key={s.id} s={s} t={t} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  dimmed,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  dimmed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:border-primary/40 hover:bg-accent/50"
      } ${dimmed && !active ? "opacity-50" : ""}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
      {count > 0 && (
        <span className={`text-xs ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          {count}
        </span>
      )}
    </button>
  );
}
