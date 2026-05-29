import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { RequireRole } from "@/components/RoleRouter";
import { useAuth } from "@/lib/auth";
import { useVendorStore } from "@/lib/useVendorStore";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { LogOut, Package, UtensilsCrossed, Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "@/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { StoreVerificationBanner } from "@/components/StoreVerificationBanner";

export const Route = createFileRoute("/vendor")({
  head: () => ({ meta: [{ title: "Vendor — SwiftDrop" }] }),
  component: () => (
    <RequireRole role="vendor">
      <VendorShell />
    </RequireRole>
  ),
});

function VendorShell() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { store, loading } = useVendorStore(user?.id);
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  const tabs = [
    { url: "/vendor", label: t("vendor.tabs.orders"), icon: Package, exact: true },
    { url: "/vendor/menu", label: t("vendor.tabs.menu"), icon: UtensilsCrossed },
    { url: "/vendor/settings", label: t("vendor.tabs.store"), icon: SettingsIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <Logo />
        <h1 className="font-display text-3xl font-bold mt-6">{t("vendor.noStore")}</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">{t("admin.applicationsHint")}</p>
        <Button variant="hero" className="mt-6" onClick={() => navigate({ to: "/become-merchant" })}>
          {t("merchant.applicationTitle")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <nav className="container mx-auto px-4 flex gap-1 border-t border-border overflow-x-auto">
          {tabs.map((tab) => {
            const active = tab.exact ? path === tab.url : path.startsWith(tab.url);
            return (
              <Link
                key={tab.url}
                to={tab.url}
                className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 -mb-px whitespace-nowrap ${
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" /> {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <StoreVerificationBanner store={store} />
        <Outlet />
      </main>
    </div>
  );
}
