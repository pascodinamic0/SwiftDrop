import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Admin settings — SwiftDrop" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <h1 className="font-display text-2xl font-bold">Account settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as {user?.email ?? "—"}
      </p>

      <Card className="p-5 mt-6">
        <h2 className="font-semibold">Change password</h2>
        <p className="mt-1 text-sm text-muted-foreground mb-4">
          Verify your current password, then choose a new one.
        </p>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
