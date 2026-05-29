import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { StoreCategoryId } from "@/lib/store-categories";
import {
  STORE_CATEGORY_META,
  STORE_CATEGORY_ORDER,
  getStoreCategoryLabel,
} from "@/lib/store-categories";

type StoreMode = "manual" | "dashboard";

export const Route = createFileRoute("/admin/stores")({
  component: AdminStores,
});

interface S {
  id: string;
  name: string;
  description: string | null;
  category: StoreCategoryId;
  address: string;
  delivery_fee: number;
  is_open: boolean;
  mode: StoreMode;
  owner_id: string | null;
  image_url: string | null;
  contact_phone: string | null;
}

async function resolveOwnerId(email: string, userId: string): Promise<string | null> {
  const trimmedId = userId.trim();
  if (trimmedId) return trimmedId;
  const trimmedEmail = email.trim();
  if (!trimmedEmail) return null;
  const { data, error } = await supabase.rpc("resolve_user_id_by_email", {
    p_email: trimmedEmail,
  });
  if (error) throw error;
  if (!data) throw new Error("No user found for that email");
  return data as string;
}

function AdminStores() {
  const [stores, setStores] = useState<S[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [addr, setAddr] = useState("");
  const [cat, setCat] = useState<StoreCategoryId>("food");
  const [mode, setMode] = useState<StoreMode>("manual");
  const [fee, setFee] = useState("2.50");
  const [img, setImg] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [linkingStoreId, setLinkingStoreId] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkUserId, setLinkUserId] = useState("");

  const load = async () => {
    const { data } = await supabase.from("stores").select("*").order("name");
    setStores((data ?? []) as S[]);
  };
  useEffect(() => {
    load();
  }, []);

  const linkOwner = async (storeId: string, email: string, userId: string) => {
    try {
      const uid = await resolveOwnerId(email, userId);
      if (!uid) {
        toast.error("Enter owner email or user ID");
        return;
      }
      const { error } = await supabase.rpc("link_store_owner", {
        p_store_id: storeId,
        p_user_id: uid,
      });
      if (error) throw error;
      toast.success("Vendor linked to store");
      setLinkEmail("");
      setLinkUserId("");
      setLinkingStoreId(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link owner");
    }
  };

  const create = async () => {
    if (!name || !addr) return toast.error("Name and address required");
    const { data: created, error } = await supabase
      .from("stores")
      .insert({
        name,
        description: desc || null,
        address: addr,
        category: cat,
        mode,
        delivery_fee: Number(fee),
        image_url: img || null,
        owner_id: null,
      })
      .select("id")
      .single();
    if (error) return toast.error(error.message);

    const storeId = (created as { id: string }).id;
    if (ownerEmail.trim() || ownerUserId.trim()) {
      await linkOwner(storeId, ownerEmail, ownerUserId);
    } else {
      toast.success("Store created");
    }

    setName("");
    setDesc("");
    setAddr("");
    setImg("");
    setOwnerEmail("");
    setOwnerUserId("");
    if (!ownerEmail.trim() && !ownerUserId.trim()) load();
  };

  const updateStore = async (id: string, patch: Partial<S>) => {
    const { error } = await supabase.from("stores").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete store and all its menu/orders refs?")) return;
    const { error } = await supabase.from("stores").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="font-display text-3xl font-bold">Stores ({stores.length})</h1>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Create new store</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={addr} onChange={(e) => setAddr(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={cat} onValueChange={(v) => setCat(v as StoreCategoryId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STORE_CATEGORY_ORDER.map((id) => (
                  <SelectItem key={id} value={id}>
                    {STORE_CATEGORY_META[id].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as StoreMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (admin handles)</SelectItem>
                <SelectItem value="dashboard">Dashboard (vendor handles)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Delivery fee ($)</Label>
            <Input type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} />
          </div>
          <div>
            <Label>Image URL</Label>
            <Input value={img} onChange={(e) => setImg(e.target.value)} />
          </div>
          <div>
            <Label>Owner email (optional)</Label>
            <Input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="vendor@example.com"
            />
          </div>
          <div>
            <Label>Owner user ID (optional)</Label>
            <Input
              value={ownerUserId}
              onChange={(e) => setOwnerUserId(e.target.value)}
              placeholder="uuid from Users tab"
            />
          </div>
        </div>
        <Button variant="hero" className="mt-4" onClick={create}>
          <Plus className="h-4 w-4" /> Create store
        </Button>
      </Card>

      <div className="space-y-2">
        {stores.map((s) => (
          <Card key={s.id} className="p-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              {s.image_url && (
                <img src={s.image_url} alt={s.name} className="h-12 w-12 rounded object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {s.address} · {getStoreCategoryLabel(s.category)} · $
                  {Number(s.delivery_fee).toFixed(2)} fee · {s.mode}
                </p>
                {s.owner_id ? (
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                    Owner: {s.owner_id}
                  </p>
                ) : (
                  <p className="text-xs text-warning mt-0.5">No vendor assigned</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">Open</span>
                <Switch
                  checked={s.is_open}
                  onCheckedChange={(v) => updateStore(s.id, { is_open: v })}
                />
              </div>
              <Select
                value={s.mode}
                onValueChange={(v) => updateStore(s.id, { mode: v as StoreMode })}
              >
                <SelectTrigger className="w-36 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLinkingStoreId(linkingStoreId === s.id ? null : s.id);
                  setLinkEmail("");
                  setLinkUserId("");
                }}
              >
                <UserPlus className="h-4 w-4" /> Assign owner
              </Button>
              <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            {linkingStoreId === s.id && (
              <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-border">
                <div className="flex-1 min-w-[180px]">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder="vendor@example.com"
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Label className="text-xs">User ID</Label>
                  <Input
                    value={linkUserId}
                    onChange={(e) => setLinkUserId(e.target.value)}
                    placeholder="uuid"
                  />
                </div>
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => linkOwner(s.id, linkEmail, linkUserId)}
                >
                  Link vendor
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
