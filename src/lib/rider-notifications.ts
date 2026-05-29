import { supabase } from "@/integrations/supabase/client";

export type RiderReviewDecision = "approved" | "rejected";

/** Updates rider verification via database RPC. Email notifications are optional (Resend — not wired yet). */
export async function reviewRiderApplication(params: {
  riderId: string;
  decision: RiderReviewDecision;
  rejectionReason?: string;
}) {
  const { error } = await supabase.rpc("review_rider_application", {
    p_rider_id: params.riderId,
    p_decision: params.decision,
    p_rejection_reason: params.rejectionReason ?? null,
  });

  if (error) throw error;

  return { ok: true as const, emailSent: false as const };
}
