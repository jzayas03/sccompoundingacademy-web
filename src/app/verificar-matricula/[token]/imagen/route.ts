import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyVerificationDecision } from "@/lib/portal/verification-token";
import { fetchViewableMatricula } from "@/lib/portal/matricula-view";

// sharp (HEIC→JPEG) needs the Node runtime, not edge.
export const runtime = "nodejs";

/**
 * Browser-viewable matrícula image for the email-link review page
 * (`/verificar-matricula/[token]`). Authorized by the SAME signed HMAC token
 * the page validates — no portal session required, since the owner opens it
 * straight from the notification email. Streams the matrícula normalized to a
 * renderable format (iPhone HEIC → JPEG; PDFs pass through), mirroring the
 * staleness check the page performs.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;
  const payload = verifyVerificationDecision(token);
  if (!payload) return new NextResponse("Enlace inválido", { status: 403 });

  const [user] = await db
    .select({
      docUrl: users.verificationDocUrl,
      submittedAt: users.verificationSubmittedAt,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user?.docUrl) return new NextResponse("Sin matrícula", { status: 404 });
  // Stale link: a newer submission replaced the one this token points at.
  if (
    !user.submittedAt ||
    user.submittedAt.getTime() !== payload.submittedAt
  ) {
    return new NextResponse("Enlace vencido", { status: 410 });
  }

  const view = await fetchViewableMatricula(user.docUrl);
  if (!view) return new NextResponse("No disponible", { status: 502 });

  return new NextResponse(new Uint8Array(view.body), {
    headers: {
      "content-type": view.contentType,
      "cache-control": "private, no-store",
      "content-disposition": "inline",
    },
  });
}
