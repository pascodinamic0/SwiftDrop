import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth, type AppRole } from "@/lib/auth";

export function RequireAuth({ children, role }: { children: ReactNode; role?: AppRole }) {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (role && !roles.includes(role) && !roles.includes("admin")) {
      // not authorized for this surface — bounce to their main dashboard
      const dest = roles.includes("delivery_agent") ? "/agent" : "/customer";
      navigate({ to: dest });
    }
  }, [user, roles, loading, role, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
