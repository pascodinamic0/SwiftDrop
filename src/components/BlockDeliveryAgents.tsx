import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { isRiderOnly } from "@/lib/roles";

/** Keeps delivery agents on the job portal — no shop/cart customer dashboard. */
export function BlockDeliveryAgents({ children }: { children: ReactNode }) {
  const { roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (isRiderOnly(roles)) {
      navigate({ to: "/rider" });
    }
  }, [roles, loading, navigate]);

  if (loading || isRiderOnly(roles)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
