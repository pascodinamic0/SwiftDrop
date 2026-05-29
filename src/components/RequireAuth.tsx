import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth, type AppRole } from "@/lib/auth";
import { dashboardFor } from "@/lib/roles";

export function RequireAuth({ children, role }: { children: ReactNode; role?: AppRole }) {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  const allowed =
    !!user && (!role || roles.includes(role) || roles.includes("admin"));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (role && !roles.includes(role) && !roles.includes("admin")) {
      navigate({ to: dashboardFor(roles) });
    }
  }, [user, roles, loading, role, navigate]);

  if (loading || !user || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
