import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireRole } from "@/components/RoleRouter";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { LogOut, Package, UtensilsCrossed, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/vendor")({
  head: () => ({ meta: [{ title: "Vendor — SwiftDrop" }] }),
  component: () => <RequireRole role="vendor"><VendorShell /></RequireRole>,
});

function VendorShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [storeState, setStoreState] = useState<"loading" | "none" | "manual" | "dashboard">(
    "loading",
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("stores")
        .select("id, mode")
        .eq("owner_id", user.id)
        .limit(1);
      const store = data?.[0] as { id: string; mode: string } | undefined;
      if (!store) setStoreState("none");
      else if (store.mode === "manual") setStoreState("manual");
      else setStoreState("dashboard");
    })();
  }, [user]);

  const tabs = [
    { url: "/vendor", label: "Orders", icon: Package, exact: true },
    { url: "/vendor/menu", label: "Menu", icon: UtensilsCrossed },
    { url: "/vendor/settings", label: "Store", icon: SettingsIcon },
  ];

  if (storeState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (storeState === "none") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <Logo />
        <h1 className="font-display text-3xl font-bold mt-6">No store linked yet</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          An admin must assign you as the owner of a store with dashboard mode enabled.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={async () => {
            await signOut();
            navigate({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    );
  }

  if (storeState === "manual") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <Logo />
        <h1 className="font-display text-3xl font-bold mt-6">Manual store mode</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Your store is operated by SwiftDrop admins. The vendor dashboard is disabled until an
          admin switches the store to dashboard mode.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={async () => {
            await signOut();
            navigate({ to: "/shop" });
          }}
        >
          Browse as customer
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}><LogOut className="h-4 w-4" /></Button>
        </div>
        <nav className="container mx-auto px-4 flex gap-1 border-t border-border">
          {tabs.map((t) => {
            const active = t.exact ? path === t.url : path.startsWith(t.url);
            return (
              <Link key={t.url} to={t.url} className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 -mb-px ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1"><Outlet /></main>
    </div>
  );
}
