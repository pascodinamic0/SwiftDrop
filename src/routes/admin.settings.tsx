import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const { user } = useAuth();
  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Account and platform configuration</p>
      </div>

      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold mb-3">Your account</h2>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <dt className="text-muted-foreground">Email</dt><dd className="col-span-2">{user?.email}</dd>
          <dt className="text-muted-foreground">User id</dt><dd className="col-span-2 font-mono text-xs">{user?.id}</dd>
          <dt className="text-muted-foreground">Role</dt><dd className="col-span-2">Administrator</dd>
        </dl>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold mb-3">Quick links</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          <Button variant="outline" asChild className="justify-between">
            <Link to="/admin/pricing">Pricing rules <ExternalLink className="h-3 w-3" /></Link>
          </Button>
          <Button variant="outline" asChild className="justify-between">
            <Link to="/admin/users">Manage roles <ExternalLink className="h-3 w-3" /></Link>
          </Button>
          <Button variant="outline" asChild className="justify-between">
            <Link to="/admin/agents">Agent fleet <ExternalLink className="h-3 w-3" /></Link>
          </Button>
          <Button variant="outline" asChild className="justify-between">
            <Link to="/admin/deliveries">All deliveries <ExternalLink className="h-3 w-3" /></Link>
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold mb-2">About SwiftDrop Admin</h2>
        <p className="text-sm text-muted-foreground">
          You have full read/write access to deliveries, users, agents, ratings, and pricing.
          Role assignments take effect immediately. Pricing changes apply to the next quote.
        </p>
      </Card>
    </div>
  );
}
