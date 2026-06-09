import { z } from "zod";
import { Resend } from "resend";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  phone: z.string().max(40).optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  message: z.string().min(1).max(5000),
  locale: z.enum(["es", "en"]),
});

export async function POST(req: Request) {
  // Distributed per-IP rate limit (Upstash). Replaces the old in-memory
  // token bucket, which reset on every serverless cold start and wasn't
  // shared across instances — so it didn't actually hold. No-op when
  // Upstash isn't configured.
  const ip = clientIp(req);
  const rl = await rateLimit("contact", ip, 5, 60);
  if (!rl.success) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid", issues: parsed.error.flatten() }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  // Prefer the unified EMAIL_FROM / EMAIL_REPLY_TO env vars (also used by
  // the Stripe webhook). Fall back to the original CONTACT_* names so
  // existing deployments keep working during the transition.
  const inbox = process.env.EMAIL_REPLY_TO ?? process.env.CONTACT_INBOX_EMAIL;
  const from = process.env.EMAIL_FROM ?? process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !inbox || !from) {
    return Response.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const { name, email, phone, subject, message, locale } = parsed.data;
  const subjectLine = subject?.trim() || `Contacto (${locale.toUpperCase()}) — ${name}`;
  const html = `
    <h2>Nueva consulta / New inquiry</h2>
    <p><strong>Nombre / Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${phone ? `<p><strong>Teléfono:</strong> ${escapeHtml(phone)}</p>` : ""}
    <p><strong>Locale:</strong> ${locale}</p>
    <hr/>
    <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
  `;

  const { error } = await resend.emails.send({
    from,
    to: inbox,
    replyTo: email,
    subject: subjectLine,
    html,
  });
  if (error) return Response.json({ error: "send_failed" }, { status: 502 });

  return Response.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
