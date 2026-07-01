import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import {
  VERIFICATION_ACCEPTED_TYPES,
  VERIFICATION_MAX_BYTES,
} from "@/lib/portal/verification";
import { rateLimit, clientIp } from "@/lib/ratelimit";

/**
 * Public client-upload token for the matrícula photo collected on the
 * enrollment form BEFORE checkout — the visitor has no portal session yet,
 * so unlike the in-portal upload route this one is unauthenticated by
 * necessity.
 *
 * It is still constrained: only image/PDF content types and a 15 MB cap
 * (`VERIFICATION_MAX_BYTES`, via `onBeforeGenerateToken`), with a random
 * suffix, AND a per-IP rate limit on the token mint below — without that a
 * script could loop this endpoint to spray unbounded 15 MB orphan blobs
 * (a storage/bandwidth cost-DoS, since the abuse never needs to reach the
 * rate-limited enrollment POST). The enrollment POST that consumes the URL
 * is Turnstile- + rate-limit-protected and re-validates the Blob-URL host.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rl = await rateLimit("matricula-upload", clientIp(request), 12, 600);
  if (!rl.success) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      },
    );
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
