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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/i18n";

export const Route = createFileRoute("/vendor/menu")({
  component: VendorMenu,
});

interface Category {
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
  is_available: boolean;
  category_id: string | null;
}

function VendorMenu() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [catName, setCatName] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [img, setImg] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState<string>("");

  const loadCategories = async (sid: string) => {
    const { data } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("store_id", sid)
      .order("sort_order")
      .order("name");
    setCategories((data ?? []) as Category[]);
  };

  const loadItems = async (sid: string) => {
    const { data } = await supabase.from("menu_items").select("*").eq("store_id", sid).order("name");
    setItems((data ?? []) as Item[]);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .order("applied_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const sid = (data as { id: string } | null)?.id ?? null;
      setStoreId(sid);
      if (sid) {
        await Promise.all([loadCategories(sid), loadItems(sid)]);
      }
    })();
  }, [user]);

  const addCategory = async () => {
    if (!storeId || !catName.trim()) return toast.error(t("vendor.categoryRequired"));
    const sort_order = categories.length;
    const { error } = await supabase
      .from("menu_categories")
      .insert({ store_id: storeId, name: catName.trim(), sort_order });
    if (error) return toast.error(error.message);
    toast.success(t("vendor.categoryAdded"));
    setCatName("");
    loadCategories(storeId);
  };

  const removeCategory = async (id: string) => {
    if (!confirm(t("vendor.deleteCategoryConfirm"))) return;
    const { error } = await supabase.from("menu_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (storeId) {
      loadCategories(storeId);
      loadItems(storeId);
    }
  };

  const addItem = async () => {
    if (!storeId || !name || !price) return toast.error(t("vendor.itemRequired"));
    const { error } = await supabase.from("menu_items").insert({
      store_id: storeId,
      name,
      description: desc || null,
      price: Number(price),
      image_url: img || null,
      category_id: itemCategoryId || null,
    });
    if (error) return toast.error(error.message);
    toast.success(t("vendor.itemAdded"));
    setName("");
    setDesc("");
    setPrice("");
    setImg("");
    setItemCategoryId("");
    loadItems(storeId);
  };

  const toggleAvail = async (id: string, v: boolean) => {
    const { error } = await supabase.from("menu_items").update({ is_available: v }).eq("id", id);
    if (error) return toast.error(error.message);
    if (storeId) loadItems(storeId);
  };

  const remove = async (id: string) => {
    if (!confirm(t("vendor.deleteItemConfirm"))) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (storeId) loadItems(storeId);
  };

  if (!storeId) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        {t("vendor.noDashboardStore")}
      </div>
    );
  }

  const categoryLabel = (categoryId: string | null) =>
    categories.find((c) => c.id === categoryId)?.name ?? t("vendor.uncategorized");

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="font-display text-2xl font-bold">{t("vendor.menu")}</h1>

      <Card className="mt-4 p-5">
        <h2 className="font-semibold mb-3">{t("vendor.categories")}</h2>
        <div className="flex gap-2 flex-wrap">
          <Input
            className="max-w-xs"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder={t("vendor.placeholderCategory")}
          />
          <Button variant="hero" onClick={addCategory}>
            <Plus className="h-4 w-4" /> {t("vendor.addCategory")}
          </Button>
        </div>
        <ul className="mt-3 space-y-1">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between text-sm py-1">
              <span>{c.name}</span>
              <Button variant="ghost" size="icon" onClick={() => removeCategory(c.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
          {categories.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("vendor.noCategories")}</p>
          )}
        </ul>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="font-semibold mb-3">{t("vendor.addItem")}</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>{t("vendor.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>{t("vendor.price")}</Label>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <Label>{t("vendor.category")}</Label>
            <Select
              value={itemCategoryId || "__none__"}
              onValueChange={(v) => setItemCategoryId(v === "__none__" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("vendor.placeholderOptional")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("vendor.uncategorized")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>{t("vendor.description")}</Label>
            <Textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>{t("vendor.imageUrl")}</Label>
            <Input
              value={img}
              onChange={(e) => setImg(e.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>
        <Button variant="hero" className="mt-4" onClick={addItem}>
          <Plus className="h-4 w-4" /> {t("common.add")}
        </Button>
      </Card>

      <h2 className="font-display text-xl font-bold mt-8">{t("vendor.allItems", { count: items.length })}</h2>
      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <Card key={it.id} className="p-3 flex items-center gap-3">
            {it.image_url && (
              <img src={it.image_url} alt={it.name} className="h-12 w-12 rounded object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{it.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {categoryLabel(it.category_id)}
                {it.description ? ` · ${it.description}` : ""}
              </p>
            </div>
            <div className="font-display font-bold">${Number(it.price).toFixed(2)}</div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{t("vendor.avail")}</span>
              <Switch
                checked={it.is_available}
                onCheckedChange={(v) => toggleAvail(it.id, v)}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(it.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
