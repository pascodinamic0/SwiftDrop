import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bike, DollarSign, Clock } from "lucide-react";

export const Route = createFileRoute("/drive")({
  head: () => ({ meta: [{ title: "Drive with SwiftDrop — earn on your schedule" }] }),
  component: DrivePage,
});

function DrivePage() {
  const { user, roles, refreshRoles } = useAuth();
  const navigate = useNavigate();

  const becomeAgent = async () => {
    if (!user) {
      navigate({ to: "/auth", search: { mode: "signup" } as never });
      return;
    }
    if (roles.includes("delivery_agent")) {
      navigate({ to: "/agent" });
      return;
    }
    const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: user.id, role: "delivery_agent" });
    if (roleErr && !roleErr.message.includes("duplicate")) {
      toast.error(roleErr.message);
      return;
    }
    const { error: profErr } = await supabase.from("agent_profiles").upsert({ id: user.id, vehicle: "bike", is_online: false });
    if (profErr) {
      toast.error(profErr.message);
      return;
    }
    await refreshRoles();
    toast.success("You're now a SwiftDrop courier!");
    navigate({ to: "/agent" });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground mb-6">
            <Bike className="h-4 w-4" /> COURIERS WANTED
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tighter">
            Earn on <span className="bg-primary px-2 -skew-x-6 inline-block">your schedule</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-xl mx-auto">
            Bike, scooter, or car — go online when you want, accept jobs near you, get paid per drop.
          </p>
          <div className="mt-8">
            <Button variant="hero" size="xl" onClick={becomeAgent}>
              {user && roles.includes("delivery_agent") ? "Open agent dashboard" : "Become a courier"}
            </Button>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-6">
          {[
            { icon: DollarSign, title: "Get paid per drop", desc: "Transparent pricing. No hidden fees." },
            { icon: Clock, title: "Flexible hours", desc: "Toggle online/offline anytime." },
            { icon: Bike, title: "Any vehicle", desc: "Foot, bike, scooter, or van — your choice." },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-border bg-card text-center">
              <f.icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>

        {!user && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/auth" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
