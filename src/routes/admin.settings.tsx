import { createFileRoute } from "@tanstack/react-router";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { useAuth } from "@/lib/auth";
import { AdminPage, AdminPageHeader, AdminPanel } from "@/components/admin/AdminPage";
import { KeyRound, Shield } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Admin settings — SwiftDrop" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const { user } = useAuth();

  return (
    <AdminPage className="max-w-2xl">
      <AdminPageHeader
        title="Account settings"
        description="Manage your admin credentials and session security."
      />

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-border/80 bg-card/95 p-4 shadow-card">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
          <Shield className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">Signed in</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email ?? "—"}</p>
        </div>
      </div>

      <AdminPanel
        title="Change password"
        description="Verify your current password, then choose a new one."
        icon={KeyRound}
      >
        <ChangePasswordForm />
      </AdminPanel>
    </AdminPage>
  );
}
