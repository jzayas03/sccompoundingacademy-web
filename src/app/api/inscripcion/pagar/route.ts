import { NextResponse } from "next/server";
import { verifyCheckoutToken } from "@/lib/portal/verification-token";
import { createStudentCheckoutSession } from "@/lib/inscripcion/checkout";
import { getSiteUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";

const CHECKOUT_LINK_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * GET /api/inscripcion/pagar?token=… — the student's emailed "pay now" link.
 * Authorized by the signed token alone (no login). Validates signature → 48h
 * freshness → DB preconditions (approved, unpaid, cohort open) and 302s to
 * Stripe Checkout. Every failure routes to a friendly /pago-cerrado page.
 */
export async function GET(req: Request): Promise<Response> {
  const origin = getSiteUrl();
  const closed = (reason: string) =>
    NextResponse.redirect(`${origin}/es/inscripcion/pago-cerrado?reason=${reason}`, 302);

  const token = new URL(req.url).searchParams.get("token") ?? "";
  const payload = verifyCheckoutToken(token);
  if (!payload) return closed("invalido");

  if (Date.now() - payload.approvedAt > CHECKOUT_LINK_TTL_MS) {
    return closed("expirado");
  }

  const outcome = await createStudentCheckoutSession(payload.userId);
  if (!outcome.ok) {
    const reason =
      outcome.reason === "already-paid" ? "pagado"
      : outcome.reason === "cohort-closed" ? "cerrada"
      : outcome.reason === "not-approved" ? "invalido"
      : "error";
    return closed(reason);
  }
  return NextResponse.redirect(outcome.url, 302);
}
