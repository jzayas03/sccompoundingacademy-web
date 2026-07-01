import "server-only";

import { Resend } from "resend";
import { buildVerificationSubmittedEmail } from "@/lib/emails/verificacion";
import { signVerificationDecision } from "./verification-token";
import { signedMatriculaUrl } from "./blob-read";
import { getSiteUrl } from "@/lib/siteUrl";

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "SCCA <info@sccompoundingacademy.com>";

/** Admins from `ADMIN_EMAILS`; falls back to the ops inbox if unset. */
function adminRecipients(): string[] {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return list.length
    ? list
    : [process.env.EMAIL_REPLY_TO ?? "info@sccompoundingacademy.com"];
}

/**
 * Email the admin(s) that a matrícula is waiting, with the photo (a signed
 * read URL — the store is private) and one-click Aprobar/Rechazar links (see
 * `verification-token.ts`). Called when a student SUBMITS their matrícula, so
 * the owner reviews BEFORE payment: the enrollment route (`/api/inscripcion`,
 * student tier) and the in-portal re-upload action both call it, producing the
 * same reviewable email. Best-effort — a send failure is logged, never thrown
 * (the row is already `pending` and reviewable in the admin panel regardless).
 */
export async function notifyMatriculaReview(p: {
  userId: string;
  name: string | null;
  email: string;
  docUrl: string | null;
  submittedAt: Date;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const site = getSiteUrl();
  const link = (decision: "approved" | "rejected") =>
    `${site}/verificar-matricula/${signVerificationDecision({
      userId: p.userId,
      decision,
      submittedAt: p.submittedAt.getTime(),
    })}`;

  // The photo lives in a private store; embed a signed URL the owner can open
  // for a week (the review email may sit in the inbox for days).
  const previewUrl = await signedMatriculaUrl(p.docUrl, 7 * 24 * 60 * 60 * 1000);

  const mail = buildVerificationSubmittedEmail({
    nombre: p.name ?? "",
    email: p.email,
    docUrl: previewUrl,
    approveUrl: link("approved"),
    rejectUrl: link("rejected"),
    submittedAt: p.submittedAt,
  });

  try {
    await new Resend(key).emails.send({
      from: FROM_ADDRESS,
      to: adminRecipients(),
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  } catch (err) {
    console.error("[verificacion] admin review email failed", err);
  }
}
