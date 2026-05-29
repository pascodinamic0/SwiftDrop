import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bike,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Zap,
  Store,
  HeartHandshake,
  BadgeCheck,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SwiftDrop — Food & groceries, delivered fast" },
      {
        name: "description",
        content:
          "Order from local restaurants and grocery stores. Pay for items upfront, delivery fee in cash on arrival.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-60" />
          <div className="container mx-auto px-4 pt-12 pb-20 md:pt-20 md:pb-28 relative">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium mb-6">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Now open in your neighborhood
                </div>
                <h1 className="text-balance text-5xl md:text-7xl font-display font-bold leading-[0.95] tracking-tighter">
                  Hot meals.
                  <br />
                  <span className="relative inline-block">
                    <span className="relative z-10">Fresh groceries.</span>
                    <span className="absolute bottom-2 left-0 right-0 h-3 md:h-5 bg-primary -z-0 -skew-x-6" />
                  </span>
                  <br />
                  At your door.
                </h1>
                <p className="mt-6 text-lg text-muted-foreground max-w-md">
                  SwiftDrop connects you with local restaurants, groceries and pharmacies. Pay for
                  items upfront, settle the delivery fee in cash on arrival.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link to="/shop">
                    <Button variant="hero" size="xl">
                      Browse stores <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/auth/rider" search={{ mode: "signup" }}>
                    <Button variant="dark" size="xl">
                      <Bike className="h-5 w-5" /> Become a rider
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 gradient-hero rounded-3xl blur-2xl opacity-40" />
                <div className="relative rounded-3xl overflow-hidden shadow-card border border-border bg-card">
                  <img
                    src={heroImg}
                    alt="Local courier delivering food"
                    width={1536}
                    height={1152}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Store,
                title: "Local stores",
                desc: "Hundreds of restaurants, groceries and pharmacies near you.",
              },
              {
                icon: ShoppingBag,
                title: "Pay smart",
                desc: "Items prepaid, delivery in cash. No surprises.",
              },
              {
                icon: ShieldCheck,
                title: "Live updates",
                desc: "Track every order from kitchen to doorstep.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-card hover:-translate-y-1 hover:shadow-glow transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 border-t border-border/60">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
                Why buy from us?
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">
                Local choice, clear pricing, and delivery that stays in sync from checkout to your
                door — without the fine-print surprises.
              </p>
            </div>
            <Link to="/why-us">
              <Button variant="outline" size="lg" className="shrink-0">
                See all reasons <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Store,
                title: "Neighbor businesses",
                desc: "Restaurants, groceries, and pharmacies you can actually visit — now reachable in a few taps.",
              },
              {
                icon: BadgeCheck,
                title: "Fees you see upfront",
                desc: "Item totals and delivery before you pay. Know what's prepaid and what's cash on arrival.",
              },
              {
                icon: HeartHandshake,
                title: "Humans on both ends",
                desc: "Stores prep your order; riders bring it home. Our job is to keep everyone aligned.",
              },
              {
                icon: ShieldCheck,
                title: "Track every step",
                desc: "Confirmation, prep, pickup, en route — stay in the loop instead of guessing.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-5 shadow-card hover:-translate-y-0.5 hover:shadow-glow transition-all"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center mb-3">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="rounded-3xl gradient-dark p-10 md:p-16 text-center text-secondary-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight relative">
              Hungry yet? <span className="text-primary">Let's go.</span>
            </h2>
            <p className="mt-4 text-secondary-foreground/70 max-w-xl mx-auto relative">
              Browse stores, fill your cart, and we'll handle the rest.
            </p>
            <div className="mt-8 flex justify-center gap-3 relative">
              <Link to="/shop">
                <Button variant="hero" size="xl">
                  Start ordering <Zap className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
