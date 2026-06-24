import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyVerificationDecision } from "@/lib/portal/verification-token";
import { confirmVerificationDecision } from "./actions";

export const metadata: Metadata = {
  title: "Verificación de matrícula · SCCA",
  robots: { index: false, follow: false },
};

/**
 * `/verificar-matricula/[token]` — admin-facing, login-free page reached
 * from the approve/reject links in the matrícula notification email. The
 * signed token (see `verification-token.ts`) is the only authorization.
 *
 * GET only renders; the decision is applied solely by the explicit
 * Confirmar button (POST → `confirmVerificationDecision`), so email
 * link-prefetchers cannot approve a student by scanning the inbox.
 *
 * Not under `[locale]` and excluded from the auth/i18n middleware by the
 * `verificar` matcher rule — so it is genuinely public.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-off-white flex min-h-screen items-center justify-center p-6">
      <div className="border-gray-300 w-full max-w-lg rounded-xl border bg-white p-8 shadow-soft">
        {children}
      </div>
    </main>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <h1 className="font-heading text-teal-deep text-2xl font-bold">{title}</h1>
      <p className="text-gray-900 mt-3 leading-relaxed">{body}</p>
    </Shell>
  );
}

export default async function VerificarMatriculaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = verifyVerificationDecision(token);

  if (!payload) {
    return (
      <Notice
        title="Enlace inválido"
        body="Este enlace de verificación no es válido. Usa los botones del correo más reciente o aprueba desde el panel de administración."
      />
    );
  }

  const [user] = await db
    .select({
      name: users.name,
      email: users.email,
      docUrl: users.verificationDocUrl,
      status: users.studentVerification,
      submittedAt: users.verificationSubmittedAt,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user) {
    return (
      <Notice
        title="Cuenta no encontrada"
        body="No encontramos la cuenta asociada a este enlace. Es posible que se haya eliminado."
      />
    );
  }

  // Stale link: a newer submission (re-upload) replaced this one.
  if (!user.submittedAt || user.submittedAt.getTime() !== payload.submittedAt) {
    return (
      <Notice
        title="Enlace vencido"
        body="Esta matrícula se volvió a enviar después de generar este enlace. Revisa el correo más reciente o el panel de administración."
      />
    );
  }

  // Already decided → show the outcome (this is also the post-confirm state).
  if (user.status !== "pending") {
    const approved = user.status === "approved";
    return (
      <Notice
        title={approved ? "Matrícula aprobada ✓" : "Matrícula rechazada"}
        body={
          approved
            ? `${user.name ?? user.email} ya puede acceder al portal de estudiante.`
            : `Se notificó a ${user.name ?? user.email} para que vuelva a subir su matrícula.`
        }
      />
    );
  }

  const approving = payload.decision === "approved";

  return (
    <Shell>
      <p className="font-heading text-teal-deep/80 text-xs font-semibold tracking-[0.18em] uppercase">
        Verificación de matrícula
      </p>
      <h1 className="font-heading text-teal-deep mt-2 text-2xl font-bold">
        {approving ? "Aprobar matrícula" : "Rechazar matrícula"}
      </h1>
      <p className="text-gray-900 mt-2 text-sm">
        <span className="font-semibold">{user.name ?? "(sin nombre)"}</span>
        <br />
        <span className="text-gray-700">{user.email}</span>
      </p>

      {user.docUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.docUrl}
          alt="Matrícula subida por el estudiante"
          className="border-gray-300 mt-4 max-h-80 w-full rounded-md border object-contain"
        />
      )}

      <form action={confirmVerificationDecision} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className={`font-heading inline-flex h-12 w-full items-center justify-center rounded-md px-6 text-sm font-semibold ring-1 transition-colors sm:text-base ${
            approving
              ? "bg-chartreuse text-teal-deep ring-teal-deep/15 hover:bg-chartreuse/95"
              : "bg-red-600 text-white ring-red-700/20 hover:bg-red-700"
          }`}
        >
          {approving ? "Confirmar aprobación" : "Confirmar rechazo"}
        </button>
      </form>

      <p className="text-gray-700 mt-3 text-xs">
        Al confirmar, se notificará al estudiante por correo. Esta acción no
        requiere iniciar sesión.
      </p>
    </Shell>
  );
}
