import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdminEmptyState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminToolbar,
} from "@/components/admin/AdminPage";
import { MapPin, Plus, Search, Store, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { StoreCategoryId } from "@/lib/store-categories";
import {
  STORE_CATEGORY_META,
  STORE_CATEGORY_ORDER,
  getStoreCategoryLabel,
} from "@/lib/store-categories";
import { cn } from "@/lib/utils";

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
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("stores").select("*").order("name");
    setStores((data ?? []) as S[]);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return stores;
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.address.toLowerCase().includes(needle) ||
        getStoreCategoryLabel(s.category).toLowerCase().includes(needle),
    );
  }, [stores, search]);

  const openCount = stores.filter((s) => s.is_open).length;
  const unassignedCount = stores.filter((s) => !s.owner_id).length;

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
    <AdminPage className="space-y-8">
      <AdminPageHeader
        title="Stores"
        description="Add partners, toggle availability, and connect vendor accounts."
        badge={
          <Badge variant="secondary" className="font-normal">
            {stores.length} total · {openCount} open
          </Badge>
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? "Hide form" : "New store"}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Open now" value={openCount} />
        <MiniStat label="Needs vendor" value={unassignedCount} accent={unassignedCount > 0} />
        <MiniStat label="Dashboard mode" value={stores.filter((s) => s.mode === "dashboard").length} />
      </div>

      {showCreate && (
        <AdminPanel
          title="Create new store"
          description="Stores appear on the shop once marked open. Assign a vendor for dashboard access."
          icon={Plus}
          footer={
            <Button variant="hero" onClick={create}>
              <Plus className="h-4 w-4" />
              Create store
            </Button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bloom & Petal" />
            </Field>
            <Field label="Address">
              <Input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="123 Main St" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <Textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Short tagline for customers"
                />
              </Field>
            </div>
            <Field label="Category">
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
            </Field>
            <Field label="Mode">
              <Select value={mode} onValueChange={(v) => setMode(v as StoreMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (admin handles)</SelectItem>
                  <SelectItem value="dashboard">Dashboard (vendor handles)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Delivery fee ($)">
              <Input type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} />
            </Field>
            <Field label="Image URL">
              <Input value={img} onChange={(e) => setImg(e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="Owner email (optional)">
              <Input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="vendor@example.com"
              />
            </Field>
            <Field label="Owner user ID (optional)">
              <Input
                value={ownerUserId}
                onChange={(e) => setOwnerUserId(e.target.value)}
                placeholder="UUID from Users"
              />
            </Field>
          </div>
        </AdminPanel>
      )}

      <section className="space-y-4">
        <AdminToolbar>
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 border-0 bg-muted/50 pl-9 shadow-none focus-visible:ring-1"
              placeholder="Search stores…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground sm:shrink-0">
            Showing {filtered.length} of {stores.length}
          </p>
        </AdminToolbar>

        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={Store}
            title={stores.length === 0 ? "No stores yet" : "No matches"}
            description={
              stores.length === 0
                ? "Create your first store using the form above."
                : "Try a different search term."
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => {
              const CatIcon = STORE_CATEGORY_META[s.category]?.Icon ?? Store;
              return (
                <article
                  key={s.id}
                  className="overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-card transition-shadow hover:shadow-glow/30"
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {s.image_url ? (
                          <img src={s.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                            <CatIcon className="h-7 w-7" />
                          </div>
                        )}
                        <span
                          className={cn(
                            "absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full ring-2 ring-card",
                            s.is_open ? "bg-success" : "bg-muted-foreground/50",
                          )}
                          title={s.is_open ? "Open" : "Closed"}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lg font-semibold tracking-tight">{s.name}</h3>
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {getStoreCategoryLabel(s.category)}
                          </Badge>
                          <Badge
                            variant={s.mode === "dashboard" ? "default" : "secondary"}
                            className="text-[10px] font-normal capitalize"
                          >
                            {s.mode}
                          </Badge>
                        </div>
                        <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-2">{s.address}</span>
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          ${Number(s.delivery_fee).toFixed(2)} delivery fee
                        </p>
                        {s.owner_id ? (
                          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                            Vendor · {s.owner_id.slice(0, 8)}…
                          </p>
                        ) : (
                          <p className="mt-1 text-xs font-medium text-warning-foreground">
                            No vendor assigned
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4 sm:border-0 sm:pt-0 sm:pl-2">
                      <label className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium">
                        Open
                        <Switch
                          checked={s.is_open}
                          onCheckedChange={(v) => updateStore(s.id, { is_open: v })}
                        />
                      </label>
                      <Select
                        value={s.mode}
                        onValueChange={(v) => updateStore(s.id, { mode: v as StoreMode })}
                      >
                        <SelectTrigger className="h-9 w-[130px] text-xs">
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
                        <UserPlus className="h-4 w-4" />
                        Assign
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => remove(s.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {linkingStoreId === s.id && (
                    <div className="flex flex-wrap items-end gap-3 border-t border-border/60 bg-muted/20 px-4 py-4 sm:px-5">
                      <Field label="Email" className="min-w-[180px] flex-1">
                        <Input
                          type="email"
                          value={linkEmail}
                          onChange={(e) => setLinkEmail(e.target.value)}
                          placeholder="vendor@example.com"
                        />
                      </Field>
                      <Field label="User ID" className="min-w-[180px] flex-1">
                        <Input
                          value={linkUserId}
                          onChange={(e) => setLinkUserId(e.target.value)}
                          placeholder="uuid"
                        />
                      </Field>
                      <Button variant="hero" size="sm" onClick={() => linkOwner(s.id, linkEmail, linkUserId)}>
                        Link vendor
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AdminPage>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card/80 px-4 py-3 shadow-sm",
        accent && "border-warning/40 bg-warning/5",
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-xl font-bold">{value}</p>
    </div>
  );
}
