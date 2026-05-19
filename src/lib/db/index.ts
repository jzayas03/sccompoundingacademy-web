import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Drizzle ORM instance backed by Neon serverless Postgres.
 *
 * The connection string falls back to a placeholder that does NOT connect to
 * anything real — this lets `next build` and unit tests succeed in
 * environments where `DATABASE_URL` is not configured. Any actual query will
 * fail at request time, which is the right place for that error to surface.
 *
 * Provision the real database via Vercel Marketplace → Neon Postgres; the
 * integration auto-injects `DATABASE_URL` into Production, Preview, and
 * Development environments.
 */

const PLACEHOLDER_URL =
  "postgresql://placeholder:placeholder@placeholder.invalid:5432/placeholder";

const sql = neon(process.env.DATABASE_URL ?? PLACEHOLDER_URL);

export const db = drizzle({ client: sql, schema });

export { schema };
