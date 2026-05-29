import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Mail } from "lucide-react";
import { useTranslation } from "@/i18n";

export function SiteFooter() {
  const { t } = useTranslation();

  const footerLinks = {
    shop: [
      { label: t("nav.browseStores"), to: "/shop" as const },
      { label: t("nav.cart"), to: "/cart" as const },
    ],
    company: [
      { label: t("nav.whyBuyFromUs"), to: "/why-us" as const },
      { label: t("nav.becomeRider"), to: "/become-rider" as const },
    ],
    legal: [
      { label: t("nav.terms"), to: "/terms" as const },
      { label: t("nav.privacy"), to: "/privacy" as const },
    ],
  };

  return (
    <footer className="mt-auto border-t border-border bg-card/40 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {t("nav.footerBlurb")}
            </p>
            <a
              href="mailto:support@swiftdrop.app"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4 shrink-0" />
              support@swiftdrop.app
            </a>
          </div>

          <nav aria-label={t("nav.shopSection")}>
            <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
              {t("nav.shopSection")}
            </h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.shop.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("nav.companySection")}>
            <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
              {t("nav.companySection")}
            </h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.company.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("nav.legalSection")}>
            <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
              {t("nav.legalSection")}
            </h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.legal.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row gap-4 justify-between items-center text-sm text-muted-foreground">
          <p>{t("nav.copyright", { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              {t("nav.termsShort")}
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              {t("nav.privacyShort")}
            </Link>
            <Link to="/why-us" className="hover:text-foreground transition-colors">
              {t("nav.whyUs")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
