import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LegalDocument } from "@/components/LegalDocument";
import { useTranslation } from "@/i18n";
import { TermsBody } from "@/i18n/legal/TermsBody";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — SwiftDrop" },
      {
        name: "description",
        content: "Terms governing use of the SwiftDrop marketplace and delivery services.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4">
        <LegalDocument title={t("legal.termsTitle")} updated={t("legal.updated")}>
          <TermsBody />
        </LegalDocument>
        <p className="text-center text-sm text-muted-foreground pb-12">
          <Link to="/" className="hover:text-primary">
            {t("common.backHome")}
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
