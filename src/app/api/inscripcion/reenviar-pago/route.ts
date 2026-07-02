import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCohort } from "@/lib/cohorts";
import { getSiteUrl } from "@/lib/siteUrl";
import { buildCheckoutLinkEmail } from "@/lib/emails/verificacion";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { canResendPayLink, mintResendCheckoutToken } from "@/lib/inscripcion/resend-pay-link";

export const runtime = "nodejs";

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "SCCA <info@sccompoundingacademy.com>";

/**
 * POST /api/inscripcion/reenviar-pago
 *
 * Handles the "resend payment link" form submitted from the pago-cerrado page.
 * Looks up the student by email; if eligible (approved + unpaid + cohort open),
 * re-signs a fresh checkout token and emails the pay link. Always redirects to
 * a neutral "check your email" state — does NOT leak whether the address exists.
 */
export async function POST(req: Request): Promise<Response> {
  const origin = getSiteUrl();
  // Neutral destination — shown regardless of whether the email exists.
  const done = NextResponse.redirect(
    `${origin}/es/inscripcion/pago-cerrado?reason=reenviado`,
    302,
  );

  // Abuse guard: 5 attempts per IP per minute.
  const ip = clientIp(req);
  const rl = await rateLimit("reenviar-pago", ip, 5, 60);
  if (!rl.success) return done; // silently swallow abuse

  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email) return done;

  const [row] = await db
    .select({
      id: users.id,
      paidAt: users.paidAt,
      studentVerification: users.studentVerification,
      verifiedAt: users.verifiedAt,
      cohortId: users.cohortId,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (row && row.verifiedAt) {
    const cohort = row.cohortId ? await getCohort(row.cohortId) : undefined;
    const eligible = canResendPayLink({
      paidAt: row.paidAt,
      studentVerification: row.studentVerification,
      verifiedAt: row.verifiedAt,
      cohortOpen: cohort?.openForEnrollment ?? false,
    });

    const key = process.env.RESEND_API_KEY;
    if (eligible && key) {
      // mintResendCheckoutToken uses Date.now() so the resent link opens a
      // fresh 48h window (see resend-pay-link.ts for the full explanation).
      const token = mintResendCheckoutToken(row.id);
      const payUrl = `${origin}/api/inscripcion/pagar?token=${encodeURIComponent(token)}`;
      const mail = buildCheckoutLinkEmail("es", payUrl);
      try {
        // Resend resolves with `{ error }` on API failures rather than
        // throwing — check it, or a rejected resend is invisible (no email,
        // no log), the same silent failure fixed in applyVerificationDecision.
        const { error } = await new Resend(key).emails.send({
          from: FROM_ADDRESS,
          to: email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        });
        if (error) {
          console.error("[reenviar-pago] email rejected by Resend", {
            to: email,
            error,
          });
        } else {
          console.log("[reenviar-pago] pay link resent", { to: email });
        }
      } catch (err) {
        console.error("[reenviar-pago] email threw", { to: email, err });
      }
    }
  }

  return done;
}
