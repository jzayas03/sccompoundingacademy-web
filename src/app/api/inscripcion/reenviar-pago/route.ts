import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCohort } from "@/lib/cohorts";
import { getSiteUrl } from "@/lib/siteUrl";
import { signCheckoutToken } from "@/lib/portal/verification-token";
import { buildCheckoutLinkEmail } from "@/lib/emails/verificacion";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { canResendPayLink } from "@/lib/inscripcion/resend-pay-link";

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
      const token = signCheckoutToken({
        userId: row.id,
        approvedAt: row.verifiedAt.getTime(),
      });
      const payUrl = `${origin}/api/inscripcion/pagar?token=${encodeURIComponent(token)}`;
      const mail = buildCheckoutLinkEmail("es", payUrl);
      try {
        await new Resend(key).emails.send({
          from: FROM_ADDRESS,
          to: email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        });
      } catch (err) {
        console.error("[reenviar-pago] email failed", err);
      }
    }
  }

  return done;
}
