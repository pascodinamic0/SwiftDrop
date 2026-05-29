import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";
import { LayoutDashboard, Package, Users, Bike, Store, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";

export function AdminSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const items = [
    { title: t("admin.overview"), url: "/admin", icon: LayoutDashboard, exact: true },
    { title: t("admin.orders"), url: "/admin/orders", icon: Package },
    { title: t("admin.stores"), url: "/admin/stores", icon: Store },
    { title: t("admin.users"), url: "/admin/users", icon: Users },
    { title: t("admin.riders"), url: "/admin/riders", icon: Bike },
    { title: t("admin.settings"), url: "/admin/settings", icon: Settings },
  ] as const;

  const isActive = (url: string, exact?: boolean) =>
    exact ? path === url : path === url || path.startsWith(url + "/");

  const initials = user?.email?.slice(0, 1).toUpperCase() ?? "A";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/80">
      <SidebarHeader className="border-b border-sidebar-border/80 bg-sidebar/50">
        <div className="flex items-center gap-2 px-2 py-2">
          {!collapsed ? (
            <Logo />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground shadow-glow">
              S
            </div>
          )}
        </div>
        {!collapsed && (
          <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("admin.console")}
          </p>
        )}
      </SidebarHeader>
      <SidebarContent className="px-1 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider">
            {t("admin.manage")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url, "exact" in item ? item.exact : false);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={
                        active
                          ? "bg-primary/15 font-medium text-foreground shadow-sm data-[active=true]:bg-primary/15"
                          : undefined
                      }
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/80 bg-sidebar/30">
        {user && (
          <div className="mb-1 flex items-center gap-2 px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{user.email}</p>
              </div>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={async () => {
            await signOut();
            navigate({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>{t("nav.signOut")}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
