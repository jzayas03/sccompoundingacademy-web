import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { fetchViewableMatricula } from "@/lib/portal/matricula-view";

// sharp (HEIC→JPEG) needs the Node runtime, not edge.
export const runtime = "nodejs";

/**
 * Admin-only browser-viewable matrícula proxy. Given `?u=<userId>`, streams
 * that student's uploaded matrícula converted to a format the browser can
 * render (HEIC/HEIF → JPEG; PDFs pass through). `?dl=1` forces a download.
 *
 * This exists because the stored file may be an iPhone HEIC, which the admin
 * dashboard's `<img>` cannot display and which downloads unopenable on
 * Windows/Android. Gated on the same `ADMIN_EMAILS` allowlist as the rest of
 * `/portal/admin`; never trusts a caller-supplied URL (looks the doc up by
 * user id) to avoid becoming an open image proxy.
 */
export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("u");
  if (!userId) return new NextResponse("Falta el parámetro u", { status: 400 });
  const download = url.searchParams.get("dl") === "1";

  const [row] = await db
    .select({ docUrl: users.verificationDocUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row?.docUrl) return new NextResponse("Sin matrícula", { status: 404 });

  const view = await fetchViewableMatricula(row.docUrl);
  if (!view) return new NextResponse("No disponible", { status: 502 });

  const ext = view.contentType === "application/pdf" ? "pdf" : "jpg";
  return new NextResponse(new Uint8Array(view.body), {
    headers: {
      "content-type": view.contentType,
      "cache-control": "private, no-store",
      "content-disposition": download
        ? `attachment; filename="matricula.${ext}"`
        : "inline",
    },
  });
}
