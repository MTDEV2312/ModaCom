import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { TestServer } from "./integration-helpers";
import { loginAdmin, registerAndLoginCustomer, startTestServer, stopTestServer } from "./integration-helpers";

let ctx: TestServer;

before(async () => {
  ctx = await startTestServer();
});

after(async () => {
  await stopTestServer(ctx.server);
});

describe("Admin integration", () => {
  it("should reject admin route without token", async () => {
    const response = await fetch(`${ctx.baseUrl}/api/v1/admin/categories`);
    assert.equal(response.status, 401);

    const payload = (await response.json()) as {
      success: boolean;
      data: null;
      message?: string;
    };

    assert.equal(payload.success, false);
    assert.equal(payload.data, null);
    assert.equal(payload.message, "Token requerido");
  });

  it("should allow admin to access admin categories", async () => {
    const adminToken = await loginAdmin(ctx.baseUrl);

    const adminResponse = await fetch(`${ctx.baseUrl}/api/v1/admin/categories`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(adminResponse.status, 200);

    const adminPayload = (await adminResponse.json()) as {
      success: boolean;
      data: Array<{
        id: string;
        slug: string;
      }>;
    };

    assert.equal(adminPayload.success, true);
    assert.ok(Array.isArray(adminPayload.data));
    assert.ok(adminPayload.data.length > 0);
  });

  it("should complete admin offers CRUD flow", async () => {
    const adminToken = await loginAdmin(ctx.baseUrl);
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const createResponse = await fetch(`${ctx.baseUrl}/api/v1/admin/offers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: `Oferta test ${suffix}`,
        description: "Oferta creada por test de integración",
        discountPercentage: 15,
        code: `TEST${Date.now()}`,
        image: "/images/offers/test.jpg",
        validFrom: "2026-01-01T00:00:00.000Z",
        validUntil: "2027-01-01T00:00:00.000Z",
        active: true,
        applicableCategories: ["hombre"],
      }),
    });

    assert.equal(createResponse.status, 201);

    const createPayload = (await createResponse.json()) as {
      success: boolean;
      data: {
        id: string;
        title: string;
        active: boolean;
        applicableCategories: string[];
      };
    };

    assert.equal(createPayload.success, true);
    assert.ok(createPayload.data.id.length > 0);
    assert.equal(createPayload.data.active, true);
    assert.deepEqual(createPayload.data.applicableCategories, ["hombre"]);

    const patchResponse = await fetch(`${ctx.baseUrl}/api/v1/admin/offers/${createPayload.data.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: `Oferta test editada ${suffix}`,
        active: false,
        applicableCategories: ["mujer", "ninos"],
      }),
    });

    assert.equal(patchResponse.status, 200);

    const patchPayload = (await patchResponse.json()) as {
      success: boolean;
      data: {
        id: string;
        title: string;
        active: boolean;
        applicableCategories: string[];
      };
    };

    assert.equal(patchPayload.success, true);
    assert.equal(patchPayload.data.id, createPayload.data.id);
    assert.equal(patchPayload.data.active, false);
    assert.equal(patchPayload.data.title, `Oferta test editada ${suffix}`);
    assert.deepEqual(patchPayload.data.applicableCategories.sort(), ["mujer", "ninos"].sort());

    const deleteResponse = await fetch(`${ctx.baseUrl}/api/v1/admin/offers/${createPayload.data.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(deleteResponse.status, 200);

    const deletePayload = (await deleteResponse.json()) as {
      success: boolean;
      data: null;
    };

    assert.equal(deletePayload.success, true);
    assert.equal(deletePayload.data, null);
  });

  it("should reject creating admin category with duplicated slug", async () => {
    const adminToken = await loginAdmin(ctx.baseUrl);

    const response = await fetch(`${ctx.baseUrl}/api/v1/admin/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "Hombre Duplicado",
        slug: "hombre",
      }),
    });

    assert.equal(response.status, 409);

    const payload = (await response.json()) as {
      success: boolean;
      data: null;
      message?: string;
    };

    assert.equal(payload.success, false);
    assert.equal(payload.data, null);
    assert.match(String(payload.message), /Ya existe una categoria con ese slug/);
  });

  it("should reject deleting category with associated products", async () => {
    const adminToken = await loginAdmin(ctx.baseUrl);

    const categoriesResponse = await fetch(`${ctx.baseUrl}/api/v1/admin/categories`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(categoriesResponse.status, 200);

    const categoriesPayload = (await categoriesResponse.json()) as {
      success: boolean;
      data: Array<{
        id: string;
        slug: string;
      }>;
    };

    assert.equal(categoriesPayload.success, true);
    const hombre = categoriesPayload.data.find((entry) => entry.slug === "hombre");
    assert.ok(hombre);

    const deleteResponse = await fetch(`${ctx.baseUrl}/api/v1/admin/categories/${hombre!.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(deleteResponse.status, 409);

    const deletePayload = (await deleteResponse.json()) as {
      success: boolean;
      data: null;
      message?: string;
    };

    assert.equal(deletePayload.success, false);
    assert.equal(deletePayload.data, null);
    assert.match(String(deletePayload.message), /tiene productos asociados/);
  });

  it("should list password reset audit events for admin", async () => {
    const customer = await registerAndLoginCustomer(ctx.baseUrl, "integration-admin-audit");

    await fetch(`${ctx.baseUrl}/api/v1/auth/recover-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.10.10.10",
        "user-agent": "ModaCom-Integration-Audit",
      },
      body: JSON.stringify({
        email: customer.email,
      }),
    });

    const adminToken = await loginAdmin(ctx.baseUrl);
    const auditResponse = await fetch(`${ctx.baseUrl}/api/v1/admin/security/password-reset-events?page=1&pageSize=20`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(auditResponse.status, 200);

    const auditPayload = (await auditResponse.json()) as {
      success: boolean;
      data: Array<{
        userEmail?: string;
        requestedIp?: string;
        requestedUserAgent?: string;
        status: string;
      }>;
      pagination: {
        totalItems: number;
      };
    };

    assert.equal(auditPayload.success, true);
    assert.ok(Array.isArray(auditPayload.data));
    assert.ok(auditPayload.pagination.totalItems >= 1);

    const match = auditPayload.data.find((event) => event.userEmail === customer.email);
    assert.ok(match);
    assert.equal(match?.requestedIp, "10.10.10.10");
    assert.equal(match?.requestedUserAgent, "ModaCom-Integration-Audit");
  });
});
