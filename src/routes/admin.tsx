import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { getAdminPageMeta } from "@/components/admin/admin-nav";
import { Separator } from "@/components/ui/separator";

function AdminShell() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const meta = getAdminPageMeta(pathname);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div
            className="pointer-events-none absolute inset-0 bg-grid opacity-40"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-32 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/80 bg-background/85 px-4 backdrop-blur-md sm:px-6">
            <SidebarTrigger className="shrink-0" />
            <Separator orientation="vertical" className="hidden h-5 sm:block" />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold tracking-tight">
                {meta.title}
              </p>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {meta.description}
              </p>
            </div>
          </header>
          <main className="relative flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
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
