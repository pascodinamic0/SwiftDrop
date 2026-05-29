import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/i18n";
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

function WhyUsPage() {
  const { t } = useTranslation();

  const pillars = [
    { icon: MapPinned, title: t("whyUs.pillar1Title"), description: t("whyUs.pillar1Desc") },
    { icon: Wallet, title: t("whyUs.pillar2Title"), description: t("whyUs.pillar2Desc") },
    { icon: Clock, title: t("whyUs.pillar3Title"), description: t("whyUs.pillar3Desc") },
    { icon: Shield, title: t("whyUs.pillar4Title"), description: t("whyUs.pillar4Desc") },
    { icon: HeartHandshake, title: t("whyUs.pillar5Title"), description: t("whyUs.pillar5Desc") },
    { icon: BadgeCheck, title: t("whyUs.pillar6Title"), description: t("whyUs.pillar6Desc") },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="container mx-auto px-4 py-16 md:py-24 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium mb-6">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> {t("whyUs.badge")}
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-balance">
                {t("whyUs.title")}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {t("whyUs.subtitle")}
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="/shop">
                  <Button variant="hero" size="xl">
                    {t("whyUs.browseStores")} <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/become-rider">
                  <Button variant="outline" size="xl">
                    {t("whyUs.deliverWithUs")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 md:py-20">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center max-w-2xl mx-auto">
            {t("whyUs.midTitle")}
          </h2>
          <p className="text-center text-muted-foreground mt-3 max-w-xl mx-auto">{t("whyUs.midDesc")}</p>
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
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="rounded-3xl gradient-dark p-10 md:p-14 text-center text-secondary-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <h2 className="font-display text-3xl md:text-4xl font-bold relative">{t("whyUs.ctaTitle")}</h2>
            <p className="mt-3 text-secondary-foreground/75 max-w-lg mx-auto relative">
              {t("whyUs.ctaSubtitle")}
            </p>
            <div className="mt-8 relative flex justify-center">
              <Link to="/shop">
                <Button variant="hero" size="xl">
                  {t("whyUs.startOrder")}
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
