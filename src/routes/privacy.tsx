import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LegalDocument } from "@/components/LegalDocument";
import { useTranslation } from "@/i18n";
import { PrivacyBody } from "@/i18n/legal/PrivacyBody";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — SwiftDrop" },
      {
        name: "description",
        content: "How SwiftDrop collects, uses, and protects your personal information.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4">
        <LegalDocument title={t("legal.privacyTitle")} updated={t("legal.updated")}>
          <PrivacyBody />
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
