import { supabase } from "@/integrations/supabase/client";

export type StoreReviewDecision = "approved" | "rejected";

export async function reviewStoreApplication(params: {
  storeId: string;
  decision: StoreReviewDecision;
  rejectionReason?: string;
}) {
  const { error } = await supabase.rpc("review_store_application", {
    p_store_id: params.storeId,
    p_decision: params.decision,
    p_rejection_reason: params.rejectionReason ?? null,
  });

  if (error) throw error;
  return { ok: true as const };
}
