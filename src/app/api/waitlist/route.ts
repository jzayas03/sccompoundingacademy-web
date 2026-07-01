import { z } from "zod";
import { Resend } from "resend";
import { rateLimit, clientIp } from "@/lib/ratelimit";

/**
 * Waitlist signups from the homepage "Reserve your seat" form.
 *
 * Mirrors /api/contact: per-IP rate limit, zod validation, and a Resend
 * notification to the ops inbox (no persistence — signups are actioned
 * from the inbox). No payment; this is an interest list for the next
 * cohort.
 */
const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  role: z.string().min(1).max(80),
  cohort: z.string().max(120).optional().nullable(),
  locale: z.enum(["es", "en"]),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = await rateLimit("waitlist", ip, 5, 60);
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
  const inbox = process.env.EMAIL_REPLY_TO ?? process.env.CONTACT_INBOX_EMAIL;
  const from = process.env.EMAIL_FROM ?? process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !inbox || !from) {
    return Response.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const { name, email, role, cohort, locale } = parsed.data;
  const html = `
    <h2>Nueva solicitud de lista de espera / New waitlist signup</h2>
    <p><strong>Nombre / Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Rol / Role:</strong> ${escapeHtml(role)}</p>
    ${cohort ? `<p><strong>Cohorte / Cohort:</strong> ${escapeHtml(cohort)}</p>` : ""}
    <p><strong>Locale:</strong> ${locale}</p>
  `;

  const { error } = await resend.emails.send({
    from,
    to: inbox,
    replyTo: email,
    subject: `Lista de espera — ${name}${cohort ? ` · ${cohort}` : ""}`,
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
