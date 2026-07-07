import { z } from "zod";

/** Validation schema for the cohort admin form. Extracted from actions.ts
 *  because a "use server" file may only export async functions. */
export const CohortFields = z.object({
  courseId: z.string().min(1),
  name: z.string().trim().max(120),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  capacity: z.coerce.number().int().min(1).max(1000),
  openForEnrollment: z.boolean(),
  audience: z.enum(["farmaceutico_tecnico", "otros_profesionales", "estudiante"]),
  featured: z.boolean(),
});
