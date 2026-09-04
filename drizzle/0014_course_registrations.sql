-- Registro liviano (spec 2026-09-04): inscripciones "pagar → confirmación"
-- que NO crean usuario del portal (Parte 2, tier subgraduado). Una fila por
-- pago completado, escrita solo por el webhook de Stripe. Sin unique global
-- de email: un egresado de Parte 1 (fila en "user") puede registrarse aquí
-- sin chocar; el UNIQUE (cohort_id, email) solo impide el doble registro en
-- la misma cohorte. Idempotente — safe to re-run.
CREATE TABLE IF NOT EXISTS "course_registrations" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "cohort_id" text NOT NULL REFERENCES "cohorts"("id"),
  "course_id" text NOT NULL,
  "tier" text NOT NULL,
  "nombre" text NOT NULL,
  "email" text NOT NULL,
  "telefono" text,
  "profesion" text,
  "amount_cents" integer,
  "stripe_session_id" text NOT NULL UNIQUE,
  "paid_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "course_registrations_cohort_email_unique" UNIQUE ("cohort_id", "email")
);
