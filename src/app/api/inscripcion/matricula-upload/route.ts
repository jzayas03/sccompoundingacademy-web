import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import {
  VERIFICATION_ACCEPTED_TYPES,
  VERIFICATION_MAX_BYTES,
} from "@/lib/portal/verification";

/**
 * Public client-upload token for the matrícula photo collected on the
 * enrollment form BEFORE checkout — the visitor has no portal session yet,
 * so unlike the in-portal upload route this one is unauthenticated by
 * necessity.
 *
 * It is still constrained: only image/PDF content types and an 8 MB cap
 * (via `onBeforeGenerateToken`), with a random suffix. The enrollment POST
 * that consumes the resulting URL is Turnstile- and rate-limit-protected and
 * re-validates that the URL is one of our own Blob URLs, so a stray token
 * here can at most orphan a small file in the bucket.
 */
export async function POST(request: Request): Promise<NextResponse> {
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
      // Persistence happens later via the enrollment → Stripe → webhook path.
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
