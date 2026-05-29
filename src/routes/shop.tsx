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
  getStoreCategoryLabel,
  isStoreCategoryId,
} from "@/lib/store-categories";
import { ArrowDownAZ, Clock, LayoutGrid, MapPin, Search, Sparkles } from "lucide-react";

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

function StoreCard({ s }: { s: StoreRow }) {
  return (
    <Link to="/shop/$storeId" params={{ storeId: s.id }}>
      <Card className="overflow-hidden hover:-translate-y-1 hover:shadow-glow transition-all cursor-pointer h-full flex flex-col">
        <div className="aspect-video bg-muted relative overflow-hidden shrink-0">
          {s.image_url && (
            <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
          )}
          {!s.is_open && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="secondary">Closed</Badge>
            </div>
          )}
          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground">
            {getStoreCategoryLabel(s.category)}
          </Badge>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-xl font-bold leading-tight">{s.name}</h3>
            <Badge variant="outline" className="text-xs shrink-0">
              ${Number(s.delivery_fee).toFixed(2)} delivery
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 grow">{s.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 min-w-0">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{s.address}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3" /> ~30 min
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Shop() {
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
        getStoreCategoryLabel(s.category).toLowerCase().includes(needle);
      return catOk && qOk;
    });
  }, [stores, cat, q]);

  const sorted = useMemo(() => sortStores(filtered, sort), [filtered, sort]);

  const groupedSections = useMemo(() => {
    if (cat !== "all") return null;
    return STORE_CATEGORY_ORDER.map((categoryId) => ({
      categoryId,
      stores: sorted.filter((s) => s.category === categoryId),
    })).filter((g) => g.stores.length > 0);
  }, [cat, sorted]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              Order from local stores
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Pick a category, sort by what matters, and browse stores near you.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center shrink-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:block">
              Sort
            </span>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-[220px] h-11">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Open first, then A–Z</SelectItem>
                <SelectItem value="name_asc">Name A–Z</SelectItem>
                <SelectItem value="name_desc">Name Z–A</SelectItem>
                <SelectItem value="fee_asc">Lowest delivery fee</SelectItem>
                <SelectItem value="fee_desc">Highest delivery fee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 h-12 text-base"
            placeholder="Search by store, address, or category…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search stores"
          />
        </div>

        <section className="mt-8" aria-label="Categories">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Categories
            </h2>
            <span className="text-xs text-muted-foreground">{stores.length} stores</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => setCat("all")}
              className={`rounded-2xl border p-4 text-left transition-all flex flex-col gap-2 min-h-[100px] ${
                cat === "all"
                  ? "border-primary bg-primary/10 shadow-glow ring-2 ring-primary/30"
                  : "border-border bg-card hover:border-primary/40 hover:bg-accent/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                </div>
                {stores.length > 0 && (
                  <Badge
                    variant={cat === "all" ? "default" : "secondary"}
                    className="shrink-0 text-[10px]"
                  >
                    {stores.length}
                  </Badge>
                )}
              </div>
              <div>
                <p className="font-display font-semibold text-sm leading-tight">All stores</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  Everything in your area
                </p>
              </div>
            </button>

            {STORE_CATEGORY_ORDER.map((categoryId) => {
              const meta = STORE_CATEGORY_META[categoryId];
              const { Icon } = meta;
              const n = counts[categoryId] ?? 0;
              const active = cat === categoryId;
              return (
                <button
                  key={categoryId}
                  type="button"
                  onClick={() => setCat(categoryId)}
                  className={`rounded-2xl border p-4 text-left transition-all flex flex-col gap-2 min-h-[100px] ${
                    active
                      ? "border-primary bg-primary/10 shadow-glow ring-2 ring-primary/30"
                      : "border-border bg-card hover:border-primary/40 hover:bg-accent/50"
                  } ${n === 0 ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge
                      variant={active ? "default" : "secondary"}
                      className="shrink-0 text-[10px]"
                    >
                      {n}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sm leading-tight">{meta.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {meta.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground mt-10 space-y-2">
            <Sparkles className="h-10 w-10 mx-auto opacity-40" />
            <p>No stores match your filters.</p>
            {(cat !== "all" || q) && (
              <button
                type="button"
                className="text-primary font-semibold text-sm hover:underline"
                onClick={() => {
                  setCat("all");
                  setQ("");
                }}
              >
                Clear filters
              </button>
            )}
          </Card>
        ) : cat === "all" && groupedSections && groupedSections.length > 1 ? (
          <div className="mt-10 space-y-12">
            {groupedSections.map(({ categoryId, stores: sectionStores }) => {
              const meta = STORE_CATEGORY_META[categoryId];
              return (
                <section key={categoryId} aria-labelledby={`cat-${categoryId}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <meta.Icon className="h-5 w-5 text-primary" />
                      <h2 id={`cat-${categoryId}`} className="font-display text-2xl font-bold">
                        {meta.label}
                      </h2>
                      <Badge variant="outline">{sectionStores.length}</Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCat(categoryId)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Only this category
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sectionStores.map((s) => (
                      <StoreCard key={s.id} s={s} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mt-10">
            {cat !== "all" && (
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <ArrowDownAZ className="h-4 w-4" />
                <span>
                  Showing {sorted.length} in{" "}
                  <strong className="text-foreground">{getStoreCategoryLabel(cat)}</strong>
                </span>
              </div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map((s) => (
                <StoreCard key={s.id} s={s} />
              ))}
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
