/**
 * Internal notification email — fires to scpcpr@gmail.com whenever a new
 * enrollment completes payment. Plain text, no styling — meant for ops
 * triage, not branding.
 */
type InternalParams = {
  nombre: string;
  email: string;
  telefono: string;
  licencia?: string;
  cursoTitulo: string;
  cohorteEtiqueta: string;
  montoFormatted: string;
  stripeSessionId: string;
  notas?: string;
  acepto_timestamp: string;
  acepto_ip: string;
  locale: "es" | "en";
};

export function buildInternalEmail(p: InternalParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Nuevo inscrito · ${p.nombre} · ${p.cursoTitulo}`;
  const text = `NUEVO INSCRITO

Curso:    ${p.cursoTitulo}
Cohorte:  ${p.cohorteEtiqueta}
Monto:    ${p.montoFormatted}

Estudiante:
  Nombre:    ${p.nombre}
  Email:     ${p.email}
  Teléfono:  ${p.telefono}
  Licencia:  ${p.licencia ?? "(no provista)"}
  Locale:    ${p.locale}

Aceptación legal:
  Timestamp: ${p.acepto_timestamp}
  IP:        ${p.acepto_ip}

Stripe session: ${p.stripeSessionId}

${p.notas ? `Notas del estudiante:\n${p.notas}\n` : ""}
---
Este correo se generó automáticamente desde el webhook de Stripe al confirmarse
el pago. La fila correspondiente debe aparecer en Airtable → Inscripciones.
`;
  // Minimal HTML version for clients that prefer it; same content as text.
  const html = `<pre style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.5;">${text.replace(/</g, "&lt;")}</pre>`;
  return { subject, html, text };
}
