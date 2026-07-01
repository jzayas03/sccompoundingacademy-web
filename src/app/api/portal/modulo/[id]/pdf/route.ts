import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { resolveViewableModule } from "@/lib/curriculum";
import { resolveVerificationGate } from "@/lib/portal/verification-gate";
import { readModuloPdf } from "@/lib/portal/module-pdf";

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
 * English file when present.
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
  const lang =
    new URL(request.url).searchParams.get("lang") === "en" ? "en" : "es";

  const [user] = await db
    .select({
      tier: users.tier,
      paidAt: users.paidAt,
      studentVerification: users.studentVerification,
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

  const bytes = await readModuloPdf(viewable.module.pdfBasename, lang);
  if (!bytes) return new NextResponse("No disponible", { status: 404 });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "content-type": "application/pdf",
      "cache-control": "private, no-store",
      "content-disposition": "inline",
    },
  });
}
