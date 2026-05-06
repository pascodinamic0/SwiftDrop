import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  HeartHandshake,
  MapPinned,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/why-us")({
  head: () => ({
    meta: [
      { title: "Why buy from us — SwiftDrop" },
      {
        name: "description",
        content: "Real reasons customers choose SwiftDrop for food, groceries, and local delivery.",
      },
    ],
  }),
  component: WhyUsPage,
});

const pillars = [
  {
    icon: MapPinned,
    title: "Truly local",
    description:
      "We spotlight restaurants, groceries, and pharmacies in your neighborhood — so your spend supports nearby businesses and arrives faster.",
  },
  {
    icon: Wallet,
    title: "Pricing you can understand",
    description:
      "See item totals, delivery fees, and what’s due when before you tap confirm. No hidden “surge” tricks buried three screens deep.",
  },
  {
    icon: Clock,
    title: "Live order tracking",
    description:
      "From confirmed to picked up to on the way — follow your order in the app so you know exactly when to meet your rider at the door.",
  },
  {
    icon: Shield,
    title: "Built for trust",
    description:
      "Accounts, orders, and payments run through secure infrastructure. Riders and stores are on the same platform, so support has real context.",
  },
  {
    icon: HeartHandshake,
    title: "Support that shows up",
    description:
      "Something off with an item or drop-off? Reach our team with your order ID and we’ll work with the store and rider to make it right.",
  },
  {
    icon: BadgeCheck,
    title: "One app, many needs",
    description:
      "Dinner, weekly groceries, and last-minute pharmacy runs — browse categories and stores in a single cart-friendly experience.",
  },
];

function WhyUsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="container mx-auto px-4 py-16 md:py-24 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium mb-6">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Why SwiftDrop
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-balance">
                Why buy from <span className="text-primary">us?</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Same-day delivery is crowded with promises. We focus on what actually matters:
                honest pricing, local choice, reliable handoffs, and software that keeps everyone —
                you, the store, and the rider — in sync.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="/shop">
                  <Button variant="hero" size="xl">
                    Browse stores <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/become-rider">
                  <Button variant="outline" size="xl">
                    Deliver with us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 md:py-20">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center max-w-2xl mx-auto">
            Six reasons customers keep coming back
          </h2>
          <p className="text-center text-muted-foreground mt-3 max-w-xl mx-auto">
            We’re obsessed with the boring stuff — clear fees, accurate ETAs, and fewer “where’s my
            order?” moments.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {pillars.map((p) => (
              <Card
                key={p.title}
                className="p-6 shadow-card border-border hover:-translate-y-0.5 hover:shadow-glow transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4">
                  <p.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="rounded-3xl gradient-dark p-10 md:p-14 text-center text-secondary-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <h2 className="font-display text-3xl md:text-4xl font-bold relative">
              Ready when you are
            </h2>
            <p className="mt-3 text-secondary-foreground/75 max-w-lg mx-auto relative">
              Open the app, pick a store, and we’ll line up the rest — from kitchen or shelf to your
              doorstep.
            </p>
            <div className="mt-8 relative flex justify-center">
              <Link to="/shop">
                <Button variant="hero" size="xl">
                  Start an order
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
