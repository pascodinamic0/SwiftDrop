import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bike, DollarSign, Clock, Zap } from "lucide-react";

export const Route = createFileRoute("/become-rider")({
  head: () => ({ meta: [{ title: "Become a rider — SwiftDrop" }] }),
  component: BecomeRider,
});

function BecomeRider() {
  const { user, roles, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<"foot"|"bike"|"motorbike"|"car">("bike");
  const [submitting, setSubmitting] = useState(false);

  const isRider = roles.includes("delivery_agent");

  const join = async () => {
    if (!user) { navigate({ to: "/auth", search: { mode: "signup" } as never }); return; }
    setSubmitting(true);
    try {
      const { error: e1 } = await supabase.from("user_roles").insert({ user_id: user.id, role: "delivery_agent" });
      if (e1 && !e1.message.includes("duplicate")) throw e1;
      const { error: e2 } = await supabase.from("rider_profiles").upsert({ id: user.id, vehicle });
      if (e2) throw e2;
      await refreshRoles();
      toast.success("You're a SwiftDrop rider! 🛵");
      navigate({ to: "/rider" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary items-center justify-center mb-4">
            <Bike className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Earn on your schedule</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Pick up jobs near you. Get paid in cash on delivery. No commitment.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-10">
          {[
            { i: DollarSign, t: "Cash in hand", d: "Customers pay you directly on delivery." },
            { i: Clock, t: "Flexible hours", d: "Toggle online whenever you're free." },
            { i: Zap, t: "Quick start", d: "Sign up takes 30 seconds." },
          ].map((f) => (
            <Card key={f.t} className="p-5"><f.i className="h-5 w-5 text-primary" /><h3 className="font-semibold mt-2">{f.t}</h3><p className="text-sm text-muted-foreground mt-1">{f.d}</p></Card>
          ))}
        </div>

        <Card className="p-6 mt-8 max-w-md mx-auto">
          {isRider ? (
            <>
              <h2 className="font-display text-2xl font-bold">You're already a rider</h2>
              <Button variant="hero" size="lg" className="w-full mt-4" onClick={() => navigate({ to: "/rider" })}>Open rider dashboard</Button>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold">Sign me up</h2>
              <div className="mt-4 space-y-3">
                <div>
                  <Label>Vehicle</Label>
                  <Select value={vehicle} onValueChange={(v) => setVehicle(v as typeof vehicle)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="foot">On foot</SelectItem>
                      <SelectItem value="bike">Bicycle</SelectItem>
                      <SelectItem value="motorbike">Motorbike</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="hero" size="lg" className="w-full mt-5" onClick={join} disabled={submitting}>
                {submitting ? "..." : user ? "Become a rider" : "Sign up to ride"}
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
