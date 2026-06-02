import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  VERIFICATION_ACCEPTED_TYPES,
  VERIFICATION_MAX_BYTES,
} from "@/lib/portal/verification";

/**
 * Issues a short-lived client-upload token so the browser can upload the
 * matrícula photo DIRECTLY to Vercel Blob (bypassing the ~4.5 MB serverless
 * body limit). Only authenticated portal users may request a token. The
 * blob URL is persisted afterwards by the `submitVerificationDoc` action —
 * we do NOT rely on `onUploadCompleted`, which does not fire in local dev.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [...VERIFICATION_ACCEPTED_TYPES],
        maximumSizeInBytes: VERIFICATION_MAX_BYTES,
        addRandomSuffix: true,
      }),
      // No-op: persistence happens in submitVerificationDoc.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
