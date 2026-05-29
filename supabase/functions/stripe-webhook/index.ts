// Stripe webhook stub — deploy after setting STRIPE_WEBHOOK_SECRET and STRIPE_SECRET_KEY in Supabase secrets.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({
        error: "Missing STRIPE_WEBHOOK_SECRET, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // TODO: verify Stripe signature (stripe.webhooks.constructEvent) and handle:
  // checkout.session.completed → orders.payment_status = paid, status = preparing, paid_at = now()
  // checkout.session.expired → optional: notify customer

  const _supabase = createClient(supabaseUrl, serviceRoleKey);

  return new Response(
    JSON.stringify({ received: true, stub: true, message: "Implement Stripe signature verification" }),
    { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
