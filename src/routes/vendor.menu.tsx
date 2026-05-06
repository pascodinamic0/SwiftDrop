import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/vendor/menu")({
  component: VendorMenu,
});

interface Item { id: string; name: string; description: string | null; price: number; image_url: string | null; is_available: boolean; }

function VendorMenu() {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [price, setPrice] = useState(""); const [img, setImg] = useState("");

  const load = async (sid: string) => {
    const { data } = await supabase.from("menu_items").select("*").eq("store_id", sid).order("name");
    setItems((data ?? []) as Item[]);
  };
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("stores").select("id").eq("owner_id", user.id).single();
      const sid = (data as { id: string } | null)?.id ?? null;
      setStoreId(sid); if (sid) load(sid);
    })();
  }, [user]);

  const addItem = async () => {
    if (!storeId || !name || !price) return toast.error("Name and price required");
    const { error } = await supabase.from("menu_items").insert({ store_id: storeId, name, description: desc || null, price: Number(price), image_url: img || null });
    if (error) return toast.error(error.message);
    toast.success("Item added"); setName(""); setDesc(""); setPrice(""); setImg("");
    load(storeId);
  };

  const toggleAvail = async (id: string, v: boolean) => {
    const { error } = await supabase.from("menu_items").update({ is_available: v }).eq("id", id);
    if (error) return toast.error(error.message);
    if (storeId) load(storeId);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (storeId) load(storeId);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="font-display text-2xl font-bold">Menu</h1>

      <Card className="mt-4 p-5">
        <h2 className="font-semibold mb-3">Add new item</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Price</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          <div className="md:col-span-2"><Label>Description</Label><Textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div className="md:col-span-2"><Label>Image URL (optional)</Label><Input value={img} onChange={(e) => setImg(e.target.value)} placeholder="https://…" /></div>
        </div>
        <Button variant="hero" className="mt-4" onClick={addItem}><Plus className="h-4 w-4" /> Add item</Button>
      </Card>

      <h2 className="font-display text-xl font-bold mt-8">All items ({items.length})</h2>
      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <Card key={it.id} className="p-3 flex items-center gap-3">
            {it.image_url && <img src={it.image_url} alt={it.name} className="h-12 w-12 rounded object-cover" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{it.name}</p>
              <p className="text-xs text-muted-foreground truncate">{it.description}</p>
            </div>
            <div className="font-display font-bold">${Number(it.price).toFixed(2)}</div>
            <div className="flex items-center gap-1"><span className="text-xs text-muted-foreground">Avail.</span><Switch checked={it.is_available} onCheckedChange={(v) => toggleAvail(it.id, v)} /></div>
            <Button variant="ghost" size="icon" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
