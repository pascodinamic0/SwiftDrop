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
import { useTranslation } from "@/i18n";
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
  const { t } = useTranslation();

  const features = [
    { icon: Store, title: t("home.feature1Title"), desc: t("home.feature1Desc") },
    { icon: ShoppingBag, title: t("home.feature2Title"), desc: t("home.feature2Desc") },
    { icon: ShieldCheck, title: t("home.feature3Title"), desc: t("home.feature3Desc") },
  ];

  const pillars = [
    { icon: Store, title: t("home.pillar1Title"), desc: t("home.pillar1Desc") },
    { icon: BadgeCheck, title: t("home.pillar2Title"), desc: t("home.pillar2Desc") },
    { icon: HeartHandshake, title: t("home.pillar3Title"), desc: t("home.pillar3Desc") },
    { icon: ShieldCheck, title: t("home.pillar4Title"), desc: t("home.pillar4Desc") },
  ];

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
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> {t("home.badge")}
                </div>
                <h1 className="text-balance text-5xl md:text-7xl font-display font-bold leading-[0.95] tracking-tighter">
                  {t("home.title1")}
                  <br />
                  <span className="relative inline-block">
                    <span className="relative z-10">{t("home.title2")}</span>
                    <span className="absolute bottom-2 left-0 right-0 h-3 md:h-5 bg-primary -z-0 -skew-x-6" />
                  </span>
                  <br />
                  {t("home.title3")}
                </h1>
                <p className="mt-6 text-lg text-muted-foreground max-w-md">{t("home.subtitle")}</p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link to="/shop">
                    <Button variant="hero" size="xl">
                      {t("home.browseStores")} <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/auth/rider" search={{ mode: "signup" }}>
                    <Button variant="dark" size="xl">
                      <Bike className="h-5 w-5" /> {t("home.becomeRider")}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 gradient-hero rounded-3xl blur-2xl opacity-40" />
                <div className="relative rounded-3xl overflow-hidden shadow-card border border-border bg-card">
                  <img
                    src={heroImg}
                    alt={t("home.heroAlt")}
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
            {features.map((f) => (
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
                {t("home.whyTitle")}
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">{t("home.whySubtitle")}</p>
            </div>
            <Link to="/why-us">
              <Button variant="outline" size="lg" className="shrink-0">
                {t("home.seeAllReasons")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pillars.map((item) => (
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
              {t("home.ctaTitle")} <span className="text-primary">{t("home.ctaHighlight")}</span>
            </h2>
            <p className="mt-4 text-secondary-foreground/70 max-w-xl mx-auto relative">
              {t("home.ctaSubtitle")}
            </p>
            <div className="mt-8 flex justify-center gap-3 relative">
              <Link to="/shop">
                <Button variant="hero" size="xl">
                  {t("home.startOrdering")} <Zap className="h-5 w-5" />
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
