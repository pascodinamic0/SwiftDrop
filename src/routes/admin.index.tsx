import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n";
import { Store, Bike, DollarSign, ArrowRight } from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
} from "@/components/admin/AdminPage";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ stores: 0, riders: 0, pendingStores: 0, revenue: 0 });

  useEffect(() => {
    (async () => {
      const [oAll, sAll, sPending, rAll] = await Promise.all([
        supabase.from("orders").select("total,status"),
        supabase.from("stores").select("id", { count: "exact" }).not("owner_id", "is", null),
        supabase
          .from("stores")
          .select("id", { count: "exact" })
          .not("owner_id", "is", null)
          .eq("verification_status", "pending"),
        supabase.from("rider_profiles").select("id", { count: "exact" }),
      ]);
      const revenue = ((oAll.data ?? []) as { total: number; status: string }[])
        .filter((o) => o.status === "delivered")
        .reduce((s, o) => s + Number(o.total), 0);
      setStats({
        stores: sAll.count ?? 0,
        pendingStores: sPending.count ?? 0,
        riders: rAll.count ?? 0,
        revenue,
      });
    })();
  }, []);

  const cards = [
    {
      i: DollarSign,
      l: t("admin.totalRevenue"),
      v: `$${stats.revenue.toFixed(2)}`,
      accent: "primary" as const,
    },
    {
      i: Store,
      l: t("admin.stores"),
      v: stats.stores,
      accent: "success" as const,
    },
    {
      i: Store,
      l: t("admin.pendingReview"),
      v: stats.pendingStores,
      accent: "warning" as const,
    },
    { i: Bike, l: t("admin.riders"), v: stats.riders, accent: "muted" as const },
  ];

  const quickLinks = [
    { to: "/admin/stores" as const, label: t("admin.stores"), hint: String(stats.stores) },
    { to: "/admin/riders" as const, label: t("admin.riders"), hint: String(stats.riders) },
  ];

  return (
    <AdminPage>
      <AdminPageHeader title={t("admin.overview")} description={t("admin.console")} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {cards.map((c) => (
          <AdminStatCard key={c.l} label={c.l} value={c.v} icon={c.i} accent={c.accent} />
        ))}
      </div>

      <AdminPanel
        title={t("admin.manage")}
        description={t("admin.console")}
        className="mt-8"
        contentClassName="p-0"
      >
        <ul className="divide-y divide-border/60">
          {quickLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40 sm:px-6"
              >
                <div>
                  <p className="font-medium">{link.label}</p>
                  <p className="text-sm text-muted-foreground">{link.hint}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </AdminPanel>
    </AdminPage>
  );
}
