import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AdminEmptyState,
  AdminPage,
  AdminPageHeader,
  AdminToolbar,
} from "@/components/admin/AdminPage";
import { ChevronRight, MapPin, Search, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { StoreCategoryId } from "@/lib/store-categories";
import { STORE_CATEGORY_META } from "@/lib/store-categories";
import { getStoreCategoryLabel } from "@/lib/store-categories-i18n";
import { useTranslation } from "@/i18n";
import type { StoreVerificationStatus, VendorStore } from "@/lib/roles";
import { getStoreStatusLabel } from "@/lib/store-status";
import { reviewStoreApplication } from "@/lib/store-notifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/stores")({
  component: AdminStores,
});

interface StoreRow extends VendorStore {
  owner_profile: { full_name: string | null; phone: string | null } | null;
}

const FILTER_OPTIONS = ["pending", "approved", "rejected", "all"] as const;

function AdminStores() {
  const { t } = useTranslation();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [filter, setFilter] = useState<"all" | StoreVerificationStatus>("pending");
  const [search, setSearch] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .not("owner_id", "is", null)
      .order("applied_at", { ascending: false, nullsFirst: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    const rows = (data ?? []) as VendorStore[];
    const ownerIds = [...new Set(rows.map((s) => s.owner_id).filter(Boolean))] as string[];
    const profileMap: Record<string, { full_name: string | null; phone: string | null }> = {};
    if (ownerIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", ownerIds);
      (profiles ?? []).forEach((p) => {
        profileMap[p.id] = { full_name: p.full_name, phone: p.phone };
      });
    }
    setStores(
      rows.map((s) => ({
        ...s,
        owner_profile: s.owner_id ? (profileMap[s.owner_id] ?? null) : null,
      })),
    );
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    let list = stores;
    if (filter !== "all") list = list.filter((s) => s.verification_status === filter);
    const needle = search.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.address.toLowerCase().includes(needle) ||
        (s.owner_profile?.full_name?.toLowerCase().includes(needle) ?? false),
    );
  }, [stores, filter, search]);

  const pendingCount = stores.filter((s) => s.verification_status === "pending").length;

  const approve = async (storeId: string) => {
    try {
      await reviewStoreApplication({ storeId, decision: "approved" });
      toast.success(t("admin.storeApproved"));
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.approvalFailed"));
    }
  };

  const reject = async (storeId: string) => {
    if (!rejectReason.trim()) {
      toast.error(t("admin.addRejectionReason"));
      return;
    }
    try {
      await reviewStoreApplication({
        storeId,
        decision: "rejected",
        rejectionReason: rejectReason.trim(),
      });
      toast.success(t("admin.applicationRejected"));
      setRejectingId(null);
      setRejectReason("");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.rejectionFailed"));
    }
  };

  const updateStore = async (id: string, patch: Partial<VendorStore>) => {
    const { error } = await supabase.from("stores").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("admin.deleteStoreConfirm"))) return;
    const { error } = await supabase.from("stores").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void load();
  };

  return (
    <AdminPage className="space-y-8">
      <AdminPageHeader
        title={t("admin.stores")}
        description={t("admin.applicationsHint")}
        badge={
          pendingCount > 0 ? (
            <Badge variant="secondary" className="font-normal">
              {t("admin.pendingApplications", { count: pendingCount })}
            </Badge>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? t("common.all") : getStoreStatusLabel(f, t)}
          </Button>
        ))}
      </div>

      <AdminToolbar>
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 border-0 bg-muted/50 pl-9 shadow-none focus-visible:ring-1"
            placeholder={t("admin.searchStores")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground sm:shrink-0">
          {t("admin.showingCount", { filtered: filtered.length, total: stores.length })}
        </p>
      </AdminToolbar>

      {filtered.length === 0 ? (
        <AdminEmptyState icon={Store} title={t("admin.noStoresInView")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filtered.map((s) => {
            const CatIcon = STORE_CATEGORY_META[s.category as StoreCategoryId]?.Icon ?? Store;
            return (
              <article
                key={s.id}
                className={cn(
                  "flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-card",
                  s.verification_status === "pending" && "ring-1 ring-primary/25",
                )}
              >
                <Link
                  to="/admin/stores/$storeId"
                  params={{ storeId: s.id }}
                  className="group block p-4 sm:p-5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex gap-3 sm:gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-16 sm:w-16">
                      {s.image_url ? (
                        <img src={s.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                          <CatIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-display text-base font-semibold sm:text-lg">{s.name}</h3>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              {getStoreCategoryLabel(s.category, t)}
                            </Badge>
                            <Badge
                              variant={
                                s.verification_status === "approved"
                                  ? "default"
                                  : s.verification_status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-[10px]"
                            >
                              {getStoreStatusLabel(s.verification_status, t)}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <p className="mt-2 flex items-start gap-1 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-2 break-words">{s.address}</span>
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {s.owner_profile?.full_name ?? t("common.dash")} · {s.owner_profile?.phone ?? ""}
                      </p>
                      <p className="mt-1 text-xs text-primary font-medium">{t("admin.viewProducts")}</p>
                    </div>
                  </div>
                </Link>

                <div className="grid grid-cols-2 gap-2 border-t border-border/60 bg-muted/10 p-3 sm:grid-cols-3 sm:p-4">
                  {s.verification_status === "approved" && (
                    <label className="col-span-2 flex min-h-10 items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-medium sm:col-span-1">
                      <span>{t("common.open")}</span>
                      <Switch
                        checked={s.is_open}
                        onCheckedChange={(v) => updateStore(s.id, { is_open: v })}
                      />
                    </label>
                  )}
                  {s.verification_status === "pending" && (
                    <>
                      <Button variant="hero" size="sm" className="h-10" onClick={() => approve(s.id)}>
                        {t("admin.approveStore")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10"
                        onClick={() => {
                          setRejectingId(rejectingId === s.id ? null : s.id);
                          setRejectReason("");
                        }}
                      >
                        {t("admin.reject")}
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" className="h-10" asChild>
                    <Link to="/admin/stores/$storeId" params={{ storeId: s.id }}>
                      {t("admin.viewProducts")}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 text-destructive hover:bg-destructive/10"
                    onClick={() => remove(s.id)}
                    aria-label={t("common.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {rejectingId === s.id && (
                  <div className="space-y-3 border-t border-border/60 bg-muted/20 p-3 sm:p-4">
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={t("admin.rejectPlaceholder")}
                      rows={2}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="destructive" size="sm" onClick={() => reject(s.id)}>
                        {t("admin.confirmRejection")}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setRejectingId(null)}>
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
