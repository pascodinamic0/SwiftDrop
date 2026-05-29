import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import type { RiderProfile } from "@/lib/roles";
import { riderStatusLabel } from "@/lib/roles";
import { Link } from "@tanstack/react-router";

export function RiderVerificationBanner({
  profile,
  compact = false,
}: {
  profile: RiderProfile;
  compact?: boolean;
}) {
  if (profile.verification_status === "approved") return null;

  const isPending = profile.verification_status === "pending";
  const isRejected = profile.verification_status === "rejected";

  const icon = isPending ? Clock : isRejected ? XCircle : ShieldAlert;
  const Icon = icon;

  return (
    <Card
      className={`border-dashed ${
        isPending
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-destructive/40 bg-destructive/5"
      } ${compact ? "p-4" : "p-6"}`}
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
              {isPending ? "Application under review" : "Application not approved"}
            </h2>
            <Badge variant="outline">{riderStatusLabel(profile.verification_status)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isPending
              ? "Your rider account is in probation. Our team is verifying your details — you'll get access to jobs once approved."
              : profile.rejection_reason
                ? profile.rejection_reason
                : "Your application was not approved. You can update your details and submit again."}
          </p>
          {profile.applied_at && (
            <p className="text-xs text-muted-foreground mt-2">
              Submitted {new Date(profile.applied_at).toLocaleString()}
            </p>
          )}
          {isRejected && (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/become-rider">Update application</Link>
            </Button>
          )}
        </div>
        {!compact && isPending && (
          <ShieldCheck className="h-8 w-8 text-amber-600/40 shrink-0 hidden sm:block" />
        )}
      </div>
    </Card>
  );
}
