import Stripe from "stripe";

/**
 * Server-side Stripe SDK instance.
 *
 * Reads STRIPE_SECRET_KEY from env at call time (not module load) so the
 * app boots even before Stripe is wired — useful while owner is still
 * activating their account. The first request that actually tries to
 * create a Checkout Session is the one that fails loudly if the key is
 * missing, which is the right behaviour: surface the misconfiguration
 * at the moment it matters.
 *
 * apiVersion is pinned so a future Stripe API release doesn't silently
 * change response shapes under us. Update intentionally.
 */
let _stripe: Stripe | null = null;

export function stripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to Vercel env vars (Production + Preview) before processing payments.",
    );
  }
  // Don't pin apiVersion explicitly — the Stripe SDK defaults to the
  // version associated with the installed SDK release, which is the
  // safe choice. Bump the SDK package + re-test when ready to upgrade.
  _stripe = new Stripe(key, { typescript: true });
  return _stripe;
}
