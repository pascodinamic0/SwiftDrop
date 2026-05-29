import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Separator } from "@/components/ui/separator";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/i18n";
import type { TFunction } from "@/i18n/translate";

function getAdminPageMeta(pathname: string, t: TFunction) {
  if (/^\/admin\/stores\/[^/]+$/.test(pathname)) {
    return { title: t("admin.productsTitle"), description: t("admin.console") };
  }
  const pages: Record<string, { title: string; description: string }> = {
    "/admin": { title: t("admin.overview"), description: t("admin.console") },
    "/admin/stores": { title: t("admin.stores"), description: t("admin.console") },
    "/admin/users": { title: t("admin.users"), description: t("admin.console") },
    "/admin/riders": { title: t("admin.riders"), description: t("admin.console") },
    "/admin/settings": { title: t("admin.settings"), description: t("admin.console") },
  };
  if (pages[pathname]) return pages[pathname];
  const base = Object.keys(pages)
    .filter((p) => p !== "/admin")
    .find((p) => pathname.startsWith(p + "/"));
  if (base) return pages[base];
  return { title: t("admin.title"), description: t("admin.console") };
}

function AdminShell() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const meta = useMemo(() => getAdminPageMeta(pathname, t), [pathname, t]);

  return (
    <SidebarProvider className="min-h-svh w-full">
      <AdminSidebar />
      <SidebarInset className="relative min-w-0 overflow-x-hidden">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden bg-grid opacity-40"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-0 h-48 w-48 translate-x-1/4 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator orientation="vertical" className="hidden h-5 sm:block" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold tracking-tight">
              {meta.title}
            </p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {meta.description}
            </p>
          </div>
          <LanguageToggle className="shrink-0" />
        </header>
        <div className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — SwiftDrop" }] }),
  component: () => (
    <RequireAuth role="admin">
      <AdminShell />
    </RequireAuth>
  ),
});
