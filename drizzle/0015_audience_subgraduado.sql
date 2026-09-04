-- Audiencia nueva "subgraduado": cohortes dedicadas para estudiantes
-- subgraduados (registro liviano, spec 2026-09-04). ADD VALUE IF NOT EXISTS
-- es idempotente; en Postgres >= 12 puede correr dentro de una transacción.
ALTER TYPE "cohort_audience" ADD VALUE IF NOT EXISTS 'subgraduado';
