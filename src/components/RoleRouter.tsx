import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth, type AppRole } from "@/lib/auth";

/** Wraps a route that requires a specific role. Bounces other roles to their dashboard. */
export function RequireRole({ children, role }: { children: ReactNode; role?: AppRole }) {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    if (role && !roles.includes(role) && !roles.includes("admin")) {
      const dest = roles.includes("admin") ? "/admin"
                 : roles.includes("vendor") ? "/vendor"
                 : roles.includes("delivery_agent") ? "/rider"
                 : "/shop";
      navigate({ to: dest });
    }
  }, [user, roles, loading, role, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>;
  }
  return <>{children}</>;
}

export function dashboardFor(roles: AppRole[]): string {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("vendor")) return "/vendor";
  if (roles.includes("delivery_agent")) return "/rider";
  return "/shop";
}
