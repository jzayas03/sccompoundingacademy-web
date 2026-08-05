import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { findAttachment, resolveViewableModule } from "@/lib/curriculum";
import { resolveVerificationGate } from "@/lib/portal/verification-gate";
import { readModuloPdf } from "@/lib/portal/module-pdf";
import { getCohort } from "@/lib/cohorts";
import { isCourseAccessActive } from "@/lib/portal/course-access";

// fs read of the private course material — Node runtime, not edge.
export const runtime = "nodejs";

/**
 * Authenticated course-material stream. Serves `private/modulos/*.pdf` only
 * after re-running the SAME gate the module page enforces — the check the
 * old `/public/modulos/*.pdf` static hosting never did (Edge middleware only
 * saw a session, not `paidAt`, so any magic-link visitor could download the
 * paid product from a guessable URL).
 *
 * Gate: signed in → module belongs to the viewer's tier (owners may view any)
 * → student matrícula approved → paid (or owner). `?lang=en` picks the
 * English file when present. `?anejo={slug}` serves one of the module's
 * declared activity annexes instead of the main PDF — the slug must exist
 * in the module's curriculum entry (whitelist, never a raw filename), and
 * every gate above applies identically.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { id } = await params;
  const searchParams = new URL(request.url).searchParams;
  const lang = searchParams.get("lang") === "en" ? "en" : "es";
  const anejoSlug = searchParams.get("anejo");

  const [user] = await db
    .select({
      tier: users.tier,
      paidAt: users.paidAt,
      studentVerification: users.studentVerification,
      cohortId: users.cohortId,
      accessExtendedUntil: users.accessExtendedUntil,
    })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const isOwner = isAdminEmail(session.user.email);

  // Tier gate — the module must belong to the viewer's curriculum (owners
  // may open any module for preview).
  const viewable = resolveViewableModule({ isOwner, userTier: user.tier, id });
  if (!viewable) return new NextResponse("No encontrado", { status: 404 });

  // Student matrícula gate — mirrors the module page's defense-in-depth.
  if (
    resolveVerificationGate({
      isOwner,
      tier: user.tier,
      studentVerification: user.studentVerification,
    }) === "redirect-verificacion"
  ) {
    return new NextResponse("Acceso restringido", { status: 403 });
  }

  // Paywall — the whole point of this route.
  if (!user.paidAt && !isOwner) {
    return new NextResponse("Pago requerido", { status: 402 });
  }

  // Access window — material access ends 30 days after the cohort closes
  // (the certificate stays available). Graduates don't keep the paid PDFs
  // forever.
  const cohort = user.cohortId ? await getCohort(user.cohortId) : null;
  if (
    !isCourseAccessActive({
      isOwner,
      cohortEndDate: cohort?.endDate ?? null,
      accessExtendedUntil: user.accessExtendedUntil,
      now: new Date(),
    })
  ) {
    return new NextResponse("Acceso al material vencido", { status: 403 });
  }

  // File selection: the main module PDF (with its optional English
  // variant), or — when `?anejo=` names a declared attachment — that
  // annex's Spanish-only file. An unknown slug is a 404, same as an
  // unknown module id.
  let basename = viewable.module.pdfBasename;
  let fileLang: "es" | "en" = lang;
  if (anejoSlug !== null) {
    const attachment = findAttachment(viewable.module, anejoSlug);
    if (!attachment) return new NextResponse("No encontrado", { status: 404 });
    basename = attachment.basename;
    fileLang = "es";
  }

  const bytes = await readModuloPdf(basename, fileLang);
  if (!bytes) return new NextResponse("No disponible", { status: 404 });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "content-type": "application/pdf",
      "cache-control": "private, no-store",
      "content-disposition": "inline",
    },
  });
}
