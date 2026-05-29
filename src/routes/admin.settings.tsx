import { createFileRoute } from "@tanstack/react-router";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/i18n";
import { AdminPage, AdminPageHeader, AdminPanel } from "@/components/admin/AdminPage";
import { KeyRound, Shield } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Admin settings — SwiftDrop" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <AdminPage className="max-w-2xl lg:max-w-3xl">
      <AdminPageHeader
        title={t("admin.accountSettings")}
        description={t("admin.console")}
      />

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-border/80 bg-card/95 p-4 shadow-card">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
          <Shield className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {t("admin.signedInAs", { email: user?.email ?? t("common.dash") })}
          </p>
        </div>
      </div>

      <AdminPanel
        title={t("admin.changePassword")}
        description={t("admin.changePasswordDesc")}
        icon={KeyRound}
      >
        <ChangePasswordForm />
      </AdminPanel>
    </AdminPage>
  );
}
