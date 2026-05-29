/**
 * Payment helpers. Stripe Checkout is optional — enable via env vars (see docs/payments.md).
 */

export function isStripeConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY &&
      typeof import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY === "string" &&
      !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.includes("your_"),
  );
}

export type PayOrderResult =
  | { mode: "mock"; message: string }
  | { mode: "stripe"; checkoutUrl: string }
  | { mode: "error"; message: string };

/**
 * Start payment for order subtotal. Uses mock flow until Stripe edge function + keys are configured.
 */
export async function payOrderSubtotal(orderId: string, subtotalCents: number): Promise<PayOrderResult> {
  if (!isStripeConfigured()) {
    return { mode: "mock", message: "Stripe not configured — use mock payment" };
  }

  void orderId;
  void subtotalCents;
  return {
    mode: "error",
    message: "Stripe checkout not wired yet. See docs/payments.md",
  };
}
