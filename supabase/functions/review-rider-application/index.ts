import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Decision = "approved" | "rejected";

function emailHtml(params: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:520px;margin:0 auto;padding:24px">
  <h1 style="font-size:22px;margin:0 0 16px">${params.title}</h1>
  <p style="margin:0 0 20px">${params.body}</p>
  <a href="${params.ctaUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${params.ctaLabel}</a>
  <p style="margin:24px 0 0;font-size:12px;color:#666">SwiftDrop — same-day delivery</p>
</body>
</html>`;
}

async function sendResendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "SwiftDrop <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set; skipping email");
    return { skipped: true as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }

  return { skipped: false as const };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin, error: roleError } = await userClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const riderId = body?.riderId as string | undefined;
    const decision = body?.decision as Decision | undefined;
    const rejectionReason = (body?.rejectionReason as string | undefined)?.trim();

    if (!riderId || !decision || !["approved", "rejected"].includes(decision)) {
      return new Response(JSON.stringify({ error: "Invalid riderId or decision" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (decision === "rejected" && !rejectionReason) {
      return new Response(JSON.stringify({ error: "rejectionReason required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: reviewError } = await userClient.rpc("review_rider_application", {
      p_rider_id: riderId,
      p_decision: decision,
      p_rejection_reason: rejectionReason ?? null,
    });
    if (reviewError) throw reviewError;

    const { data: riderUser, error: riderUserError } = await adminClient.auth.admin.getUserById(riderId);
    if (riderUserError) throw riderUserError;

    const email = riderUser.user?.email;
    const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:5173";
    const portalUrl = `${appUrl}/rider`;

    let emailResult = { skipped: true as boolean };
    if (email) {
      if (decision === "approved") {
        emailResult = await sendResendEmail(
          email,
          "You're verified — start taking SwiftDrop jobs",
          emailHtml({
            title: "Welcome to the fleet",
            body: "Your rider application has been approved. You can go online in the job portal and accept deliveries near you.",
            ctaLabel: "Open job portal",
            ctaUrl: portalUrl,
          }),
        );
      } else {
        emailResult = await sendResendEmail(
          email,
          "SwiftDrop rider application update",
          emailHtml({
            title: "Application not approved",
            body: `We couldn't approve your rider application at this time.${rejectionReason ? ` Reason: ${rejectionReason}` : ""} You can update your details and submit again.`,
            ctaLabel: "Update application",
            ctaUrl: `${appUrl}/become-rider`,
          }),
        );
      }
    }

    return new Response(
      JSON.stringify({ ok: true, emailSent: !emailResult.skipped, email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
