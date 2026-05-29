import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldAlert, XCircle } from "lucide-react";
import type { VendorStore } from "@/lib/roles";
import { getStoreStatusLabel } from "@/lib/store-status";
import { useTranslation } from "@/i18n";
import { Link } from "@tanstack/react-router";

export function StoreVerificationBanner({ store }: { store: VendorStore }) {
  const { t } = useTranslation();

  if (store.verification_status === "approved") return null;

  const isPending = store.verification_status === "pending";
  const isRejected = store.verification_status === "rejected";
  const Icon = isPending ? Clock : isRejected ? XCircle : ShieldAlert;

  return (
    <Card
      className={`border-dashed mb-6 ${
        isPending
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-destructive/40 bg-destructive/5"
      } p-4 sm:p-6`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
            isPending ? "bg-amber-500/15 text-amber-700" : "bg-destructive/15 text-destructive"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-lg font-bold">
              {isPending ? t("merchant.bannerPendingTitle") : t("merchant.bannerRejectedTitle")}
            </h2>
            <Badge variant="outline">{getStoreStatusLabel(store.verification_status, t)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isPending
              ? t("merchant.bannerPendingDesc")
              : store.rejection_reason
                ? store.rejection_reason
                : t("merchant.bannerRejectedDesc")}
          </p>
          {isRejected && (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/become-merchant">{t("merchant.updateApplicationBtn")}</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
