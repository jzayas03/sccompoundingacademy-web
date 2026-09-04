/**
 * GET /api/admin/export-registros — CSV de registros livianos (spec
 * 2026-09-04 §7). Admin-only (mismo gate isAdminEmail que /api/admin/export).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  authFn: vi.fn(),
  listRegistrationsFn: vi.fn(),
  listCohortsFn: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth", () => ({ auth: mocks.authFn }));

vi.mock("@/lib/admin", () => ({
  isAdminEmail: (email: string) => email === "admin@scca.test",
}));

vi.mock("@/lib/registrations", () => ({
  listRegistrations: mocks.listRegistrationsFn,
}));

vi.mock("@/lib/cohorts", () => ({
  listCohorts: mocks.listCohortsFn,
  formatCohortLabel: vi.fn().mockReturnValue("1–2 de octubre de 2026"),
}));

import { GET } from "@/app/api/admin/export-registros/route";

describe("GET /api/admin/export-registros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listRegistrationsFn.mockResolvedValue([
      {
        id: "r1",
        cohortId: "cohort-parte2",
        courseId: "parte-2",
        tier: "profesional",
        nombre: "Carlos Ruiz",
        email: "carlos@example.com",
        telefono: "787-555-0199",
        profesion: "farmaceutico",
        amountCents: 174_500,
        stripeSessionId: "cs_x",
        paidAt: new Date("2026-09-04T12:00:00Z"),
        createdAt: new Date("2026-09-04T12:00:00Z"),
      },
    ]);
    mocks.listCohortsFn.mockResolvedValue([
      {
        id: "cohort-parte2",
        courseId: "parte-2",
        startDate: new Date("2026-10-01"),
        endDate: new Date("2026-10-02"),
        capacity: 10,
        openForEnrollment: true,
        featured: false,
        audience: "farmaceutico_tecnico",
        name: null,
      },
    ]);
  });

  it("sin sesión admin → 403 y ninguna consulta", async () => {
    mocks.authFn.mockResolvedValue({ user: { email: "alguien@example.com" } });
    const res = await GET();
    expect(res.status).toBe(403);
    expect(mocks.listRegistrationsFn).not.toHaveBeenCalled();
  });

  it("admin → CSV con la fila, título display del curso y monto en dólares", async () => {
    mocks.authFn.mockResolvedValue({ user: { email: "admin@scca.test" } });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("scca-registros-");

    const body = await res.text();
    expect(body).toContain("Carlos Ruiz");
    expect(body).toContain("carlos@example.com");
    expect(body).toContain("Compounding No Estéril Avanzado — Parte 2");
    expect(body).toContain("1745.00");
    expect(body).toContain("2026-09-04");
    expect(body).not.toContain("cs_x"); // sin ids de Stripe en el CSV
  });
});
