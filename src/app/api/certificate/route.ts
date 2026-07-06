import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  type CertProgram,
  getOrCreateCertificate,
  isEligibleForCertificate,
  programFor,
} from "@/lib/certificates";
import { renderCertificatePdf } from "@/lib/certificates/render";
import { requiredOrdinals, resolveEffectiveTier } from "@/lib/curriculum";
import { getSiteUrl } from "@/lib/siteUrl";
import { isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";

/**
 * GET /api/certificate — download the signed-in student's certificate.
 *
 * Phase A scope is self-service only (a student downloads their own
 * cert), so there is no `[userId]` param — the user is identified by
 * the auth session. A future admin route can read `[userId]` from URL
 * once an admin namespace exists.
 *
 * Server-side flow:
 *   1. Auth: requires a valid Auth.js session. Anonymous → 401.
 *   2. DB lookup: pull the `users` row by email, surface 401 if absent.
 *   3. Paid gate: `users.paidAt` must be set (PR 4 enforces this on
 *      the portal navigation; we re-check here so a direct API hit
 *      cannot bypass it).
 *   4. Eligibility: all three module post-tests must show at least
 *      one passing attempt.
 *   5. Cert allocation: `getOrCreateCertificate` is idempotent — first
 *      download mints a new `SCCA-{YYYY}-{NNN}` row, every subsequent
 *      download reuses it.
 *   6. PDF: generated on-the-fly via `pdf-lib`. Re-downloads regenerate
 *      the bytes; certificate identity is the DB row, not the PDF file.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  // Owner/admin preview path — renders the cert PDF with a placeholder
  // number so the academy can verify the design without paying or
  // consuming a real `SCCA-{YYYY}-{NNN}` slot. No DB insert, no
  // verification URL (the QR points at the placeholder route, which
  // returns "not found"; the cert is clearly marked as preview by its
  // number). See src/lib/admin.ts for the allowlist.
  const isOwner = isAdminEmail(session.user.email);

  const preview = new URL(req.url).searchParams.get("preview");
  const effectiveTier = resolveEffectiveTier({
    isOwner,
    userTier: user.tier,
    preview,
  });
  // Certificate program selects the cert variant: "student" and
  // "profesional-completion" render a completion certificate with no ACPE
  // CE credit / provider line, while "profesional" renders the
  // credit-bearing ACPE variant. Owner/admin preview is controlled
  // explicitly by ?preview= so the academy can QA every certificate variant
  // regardless of their own row's tier/profession; real (non-owner) users
  // always get programFor(their tier, their professional_type) — preview
  // never affects a non-owner.
  const program: CertProgram = isOwner
    ? preview === "completion"
      ? "profesional-completion"
      : preview === "student"
        ? "student"
        : preview === "profesional"
          ? "profesional"
          : programFor(effectiveTier, user.professionalType)
    : programFor(effectiveTier, user.professionalType);
  if (isOwner) {
    const siteUrl = getSiteUrl();
    const previewCertNo = "SCCA-PREVIEW";
    const pdfBytes = await renderCertificatePdf({
      certNo: previewCertNo,
      studentName: user.name?.trim() || session.user.email,
      issuedAt: new Date(),
      verificationUrl: `${siteUrl}/verificar/${previewCertNo}`,
      program,
    });
    return new NextResponse(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${previewCertNo}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  }

  if (!user.paidAt) {
    return NextResponse.json(
      { error: "Payment required to download certificate." },
      { status: 402 },
    );
  }

  const eligibility = await isEligibleForCertificate(user.id, user.tier);
  if (!eligibility.eligible) {
    return NextResponse.json(
      {
        error: `All ${requiredOrdinals(user.tier).length} module post-tests must be passed first.`,
        passedModules: eligibility.passedModules,
      },
      { status: 409 },
    );
  }

  const { cert } = await getOrCreateCertificate(user.id, program);

  const siteUrl = getSiteUrl();
  const verificationUrl = `${siteUrl}/verificar/${cert.certNo}`;

  const pdfBytes = await renderCertificatePdf({
    certNo: cert.certNo,
    studentName: user.name?.trim() || session.user.email,
    issuedAt: cert.issuedAt,
    verificationUrl,
    program,
  });

  return new NextResponse(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${cert.certNo}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
