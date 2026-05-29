import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AdminEmptyState,
  AdminPage,
  AdminPageHeader,
  AdminToolbar,
} from "@/components/admin/AdminPage";
import { Search, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

type AppRole = "customer" | "delivery_agent" | "admin" | "vendor";
const ALL_ROLES: AppRole[] = ["customer", "delivery_agent", "vendor", "admin"];

const ROLE_STYLES: Record<AppRole, string> = {
  customer: "border-border bg-muted/50",
  delivery_agent: "border-primary/30 bg-primary/10",
  vendor: "border-success/30 bg-success/10",
  admin: "border-secondary/30 bg-secondary/10",
};

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

interface P {
  id: string;
  full_name: string | null;
  phone: string | null;
}

function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<P[]>([]);
  const [roles, setRoles] = useState<Record<string, AppRole[]>>({});
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data: ps } = await supabase.from("profiles").select("id,full_name,phone").order("full_name");
    const list = (ps ?? []) as P[];
    setUsers(list);
    const { data: rs } = await supabase.from("user_roles").select("user_id,role");
    const m: Record<string, AppRole[]> = {};
    ((rs ?? []) as { user_id: string; role: AppRole }[]).forEach((r) => {
      (m[r.user_id] ||= []).push(r.role);
    });
    setRoles(m);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(
      (u) =>
        (u.full_name?.toLowerCase().includes(needle) ?? false) ||
        u.id.toLowerCase().includes(needle) ||
        (u.phone?.includes(needle) ?? false),
    );
  }, [users, search]);

  const toggleRole = async (uid: string, role: AppRole) => {
    const has = (roles[uid] ?? []).includes(role);
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
      if (error) return toast.error(error.message);
    }
    toast.success(t("admin.updated"));
    load();
  };

  return (
    <AdminPage className="space-y-6">
      <AdminPageHeader
        title={t("admin.users")}
        description={t("admin.console")}
        badge={
          <Badge variant="secondary" className="font-normal">
            {t("admin.usersCount", { count: users.length })}
          </Badge>
        }
      />

      <AdminToolbar>
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 border-0 bg-muted/50 pl-9 shadow-none focus-visible:ring-1"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </AdminToolbar>

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title={t("admin.users")}
          description={t("admin.console")}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => {
            const userRoles = roles[u.id] ?? [];
            const initials =
              (u.full_name?.trim().charAt(0) || u.id.charAt(0)).toUpperCase() || "?";

            return (
              <article
                key={u.id}
                className="rounded-xl border border-border/80 bg-card/95 p-4 shadow-card sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-lg font-semibold">
                        {u.full_name || t("common.unnamedRider")}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{u.id}</p>
                      {u.phone && <p className="mt-1 text-sm text-muted-foreground">{u.phone}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {userRoles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No roles assigned</span>
                        ) : (
                          userRoles.map((r) => (
                            <Badge key={r} variant="outline" className="capitalize">
                              {r.replace("_", " ")}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 lg:max-w-md lg:justify-end">
                    {ALL_ROLES.map((r) => {
                      const active = userRoles.includes(r);
                      return (
                        <Button
                          key={r}
                          variant={active ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "capitalize text-xs",
                            active && ROLE_STYLES[r],
                          )}
                          onClick={() => toggleRole(u.id, r)}
                        >
                          {r.replace("_", " ")}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
