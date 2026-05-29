# Payments (Stripe)

SwiftDrop collects the **item subtotal** online after the store confirms the order. The **delivery fee** is always cash on delivery.

## Current behavior

Without Stripe keys, customers use **mock payment** on the order page (`payment_status` → `paid`, `status` → `preparing`). This is suitable for local development only.

## Enable Stripe

1. Create a [Stripe](https://dashboard.stripe.com) account and get:
   - Publishable key → `VITE_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY` (Supabase Edge Function secret)
   - Webhook signing secret → `STRIPE_WEBHOOK_SECRET`

2. Add to `.env` (see `.env.example` commented placeholders).

3. Deploy the webhook edge function:

   ```bash
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```

4. In Stripe Dashboard → Webhooks, point to:

   `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`

   Events: `checkout.session.completed`, `checkout.session.expired`

5. Implement `create-checkout-session` (future): server creates a Checkout Session for `orders.subtotal`, stores `stripe_session_id` on the order, and redirects the customer. The webhook in `supabase/functions/stripe-webhook/index.ts` marks `payment_status = paid` and `status = preparing`.

## Webhook handler

`supabase/functions/stripe-webhook/index.ts` is a stub that verifies configuration and documents the expected payload handling. Complete it before production use.

## Security

- Never expose `STRIPE_SECRET_KEY` in the Vite client bundle.
- Verify webhook signatures with `STRIPE_WEBHOOK_SECRET`.
- Update orders only from the webhook using the service role client, matching `metadata.order_id`.
