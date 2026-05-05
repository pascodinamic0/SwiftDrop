import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bike, Package, ShieldCheck, Sparkles, Star, Zap } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SwiftDrop — Same-day delivery, on-demand" },
      { name: "description", content: "Send anything, anywhere. Bike couriers and drones, one tap away. Transparent pricing, live tracking, instant matching." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="container mx-auto px-4 pt-12 pb-20 md:pt-20 md:pb-28 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium mb-6">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Now with simulated drone delivery
              </div>
              <h1 className="text-balance text-5xl md:text-7xl font-display font-bold leading-[0.95] tracking-tighter">
                Anything.<br />
                <span className="relative inline-block">
                  <span className="relative z-10">Anywhere.</span>
                  <span className="absolute bottom-2 left-0 right-0 h-3 md:h-5 bg-primary -z-0 -skew-x-6" />
                </span><br />
                In minutes.
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-md">
                SwiftDrop matches your package with the closest courier or drone — instantly. Track every meter, pay only for what you ship.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/auth" search={{ mode: "signup" } as never}>
                  <Button variant="hero" size="xl">
                    Send a package <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/drive">
                  <Button variant="dark" size="xl">
                    <Bike className="h-5 w-5" /> Drive with us
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-semibold text-foreground">4.9</span> avg rating
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">~6 min</span> ETA
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 gradient-hero rounded-3xl blur-2xl opacity-40" />
              <div className="relative rounded-3xl overflow-hidden shadow-card border border-border bg-card">
                <img src={heroImg} alt="Courier on bike with delivery drone overhead" width={1536} height={1152} className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: "Instant matching", desc: "Closest available courier accepts within seconds." },
            { icon: Package, title: "Any size", desc: "Documents, groceries, gear — fair price by size & distance." },
            { icon: ShieldCheck, title: "Live tracking", desc: "Watch your package move on the map until it lands." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-card hover:-translate-y-1 hover:shadow-glow transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div className="rounded-3xl gradient-dark p-10 md:p-16 text-center text-secondary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-10" />
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight relative">
            Ready to send your first <span className="text-primary">drop</span>?
          </h2>
          <p className="mt-4 text-secondary-foreground/70 max-w-xl mx-auto relative">
            Sign up in 30 seconds. No subscription, pay per delivery.
          </p>
          <div className="mt-8 flex justify-center gap-3 relative">
            <Link to="/auth" search={{ mode: "signup" } as never}>
              <Button variant="hero" size="xl">Get started — it's free</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SwiftDrop. Built fast.
      </footer>
    </div>
  );
}
