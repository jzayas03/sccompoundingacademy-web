import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/lib/db";
import { users, quizAttempts } from "@/lib/db/schema";
import { findAttachment, resolveViewableModule } from "@/lib/curriculum";
import { getQuiz, type ModuleQuizId } from "@/lib/quizzes";
import { resolveModuleAccess } from "@/lib/portal/module-access";
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
 * → student matrícula approved → paid AND pre-test taken (or owner, who
 * bypasses both) → course-access window open. The payment + pre-test pair
 * is decided by the SAME `resolveModuleAccess` policy the module page uses,
 * so the two can never drift apart: gating only the page would let a paid
 * student read a later module's material straight from this URL without
 * ever taking that module's diagnostic pre-test.
 *
 * `?lang=en` picks the English file when present. `?anejo={slug}` serves one
 * of the module's declared activity annexes instead of the main PDF — the
 * slug must exist in the module's curriculum entry (whitelist, never a raw
 * filename), and every gate above applies identically.
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
      id: users.id,
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

  // Payment + pre-test gate — the same policy object the module page runs,
  // so this URL can never serve material the page itself would have
  // withheld. The pre-attempt lookup only runs when it can change the
  // outcome (a paid non-owner on a module that has a quiz bank).
  const hasQuiz = getQuiz(id as ModuleQuizId).length > 0;
  let hasPreAttempt = false;
  if (!isOwner && user.paidAt && hasQuiz) {
    const [preDone] = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, user.id),
          eq(quizAttempts.moduleId, viewable.module.ordinal),
          eq(quizAttempts.phase, "pre"),
        ),
      )
      .limit(1);
    hasPreAttempt = Boolean(preDone);
  }

  const access = resolveModuleAccess({
    isOwner,
    hasPaid: Boolean(user.paidAt),
    hasQuiz,
    hasPreAttempt,
  });
  if (access.kind === "redirect") {
    // The page redirects; an API returns a status. "dashboard" is the
    // unpaid branch (402, the paywall), "pre-test" is the diagnostic gate.
    return access.to === "dashboard"
      ? new NextResponse("Pago requerido", { status: 402 })
      : new NextResponse("Pre-test requerido", { status: 403 });
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
