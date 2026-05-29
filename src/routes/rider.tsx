import { createFileRoute, Outlet, useRouterState, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireRole } from "@/components/RoleRouter";
import { RiderVerificationBanner } from "@/components/RiderVerificationBanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRiderProfile } from "@/lib/useRiderProfile";
import { isVerifiedRider } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Logo } from "@/components/Logo";
import { LogOut, Package, DollarSign, Bike, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/rider")({
  head: () => ({ meta: [{ title: "Rider — SwiftDrop" }] }),
  component: () => (
    <RequireRole role="delivery_agent">
      <RiderShell />
    </RequireRole>
  ),
});

function RiderShell() {
  const { user, signOut } = useAuth();
  const { profile, refresh } = useRiderProfile();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [online, setOnline] = useState(false);
  const verified = isVerifiedRider(profile);

  useEffect(() => {
    if (!profile) return;
    setOnline(profile.is_online && verified);
  }, [profile, verified]);

  const toggleOnline = async (v: boolean) => {
    if (!user || !verified) {
      toast.error("You must be verified before going online");
      return;
    }
    setOnline(v);
    const { error } = await supabase.from("rider_profiles").update({ is_online: v }).eq("id", user.id);
    if (error) {
      setOnline(!v);
      toast.error(error.message);
    } else {
      await refresh();
    }
  };

  const tabs = [
    { url: "/rider", label: "Jobs", icon: Package, exact: true },
    { url: "/rider/active", label: "Active", icon: Bike },
    { url: "/rider/earnings", label: "Earnings", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            {verified ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border">
                {online ? (
                  <Wifi className="h-4 w-4 text-success" />
                ) : (
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs font-semibold">{online ? "Online" : "Offline"}</span>
                <Switch checked={online} onCheckedChange={toggleOnline} />
              </div>
            ) : (
              <span className="hidden sm:inline text-xs font-semibold text-amber-700 bg-amber-500/10 px-3 py-1 rounded-full">
                Probation
              </span>
            )}
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
        <nav className="container mx-auto px-4 flex gap-1 border-t border-border">
          {tabs.map((t) => {
            const active = t.exact ? path === t.url : path.startsWith(t.url);
            return (
              <Link
                key={t.url}
                to={t.url}
                className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 -mb-px ${
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {profile && profile.verification_status !== "approved" && (
        <div className="container mx-auto px-4 pt-4">
          <RiderVerificationBanner profile={profile} compact />
        </div>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
