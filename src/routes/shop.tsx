import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "Browse stores — SwiftDrop" }] }),
  component: Shop,
});

interface StoreRow {
  id: string; name: string; description: string | null; category: string;
  image_url: string | null; address: string; delivery_fee: number; is_open: boolean; mode: string;
}

const CATEGORIES = ["all", "food", "grocery", "pharmacy", "other"];

function Shop() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("*").order("name");
      setStores((data ?? []) as StoreRow[]);
      setLoading(false);
    })();
  }, []);

  const filtered = stores.filter((s) =>
    (cat === "all" || s.category === cat) &&
    (q === "" || s.name.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Order from local stores</h1>
        <p className="text-muted-foreground mt-2">Restaurants, groceries, pharmacies — all in one place.</p>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 h-12" placeholder="Search stores…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-all ${cat === c ? "bg-secondary text-secondary-foreground" : "bg-muted hover:bg-accent"}`}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {Array.from({ length: 6 }).map((_, i) => <Card key={i} className="h-64 animate-pulse bg-muted" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground mt-6">No stores match.</Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filtered.map((s) => (
              <Link key={s.id} to="/shop/$storeId" params={{ storeId: s.id }}>
                <Card className="overflow-hidden hover:-translate-y-1 hover:shadow-glow transition-all cursor-pointer h-full">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {s.image_url && <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />}
                    {!s.is_open && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Badge variant="secondary">Closed</Badge>
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-background/90 text-foreground capitalize">{s.category}</Badge>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-xl font-bold">{s.name}</h3>
                      <Badge variant="outline" className="text-xs shrink-0">${Number(s.delivery_fee).toFixed(2)} delivery</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.address}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> ~30 min</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
