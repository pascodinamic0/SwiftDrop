import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [{ title: "How SwiftDrop works" }, { name: "description", content: "Three steps from package to drop-off." }] }),
  component: HowItWorks,
});

function HowItWorks() {
  const steps = [
    { n: "01", title: "Set pickup & drop-off", desc: "Tap two points on the map. We'll calculate distance and show transparent price." },
    { n: "02", title: "We match instantly", desc: "Closest available agent or drone accepts within seconds. No bidding, no surge games." },
    { n: "03", title: "Track every meter", desc: "Live map of your courier moving from A to B. Rate them when delivered." },
  ];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tighter">How it works</h1>
        <p className="mt-4 text-xl text-muted-foreground">No subscriptions. No surge. Just same-day delivery.</p>
        <div className="mt-16 space-y-4">
          {steps.map((s) => (
            <div key={s.n} className="grid md:grid-cols-[120px_1fr] gap-6 p-8 rounded-2xl border border-border bg-card">
              <div className="font-display text-6xl font-bold text-primary">{s.n}</div>
              <div>
                <h3 className="font-display text-2xl font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link to="/auth" search={{ mode: "signup" } as never}>
            <Button variant="hero" size="xl">Send your first package</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
