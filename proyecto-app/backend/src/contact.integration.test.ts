import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { TestServer } from "./integration-helpers";
import { startTestServer, stopTestServer } from "./integration-helpers";

let ctx: TestServer;

before(async () => {
  ctx = await startTestServer();
});

after(async () => {
  await stopTestServer(ctx.server);
});

describe("Contact integration", () => {
  it("should create contact message", async () => {
    const response = await fetch(`${ctx.baseUrl}/api/v1/contact/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Contact",
        email: `contact-${Date.now()}@example.com`,
        phone: "+34123456789",
        subject: "Consulta de integración",
        message: "Mensaje generado por test de integración",
      }),
    });

    assert.equal(response.status, 201);

    const payload = (await response.json()) as {
      success: boolean;
      data: {
        id: string;
        status: string;
      };
    };

    assert.equal(payload.success, true);
    assert.ok(payload.data.id.length > 0);
    assert.equal(payload.data.status, "new");
  });

  it("should enforce contact rate limit", async () => {
    const ipHeader = `integration-contact-limit-${Date.now()}`;
    let lastStatus = 0;

    for (let index = 1; index <= 21; index += 1) {
      const response = await fetch(`${ctx.baseUrl}/api/v1/contact/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": ipHeader,
        },
        body: JSON.stringify({
          name: `Rate Limit ${index}`,
          email: `ratelimit-${Date.now()}-${index}@example.com`,
          subject: "Rate limit contact",
          message: `Mensaje ${index}`,
        }),
      });

      lastStatus = response.status;

      if (index <= 20) {
        assert.equal(response.status, 201);
      }

      if (index === 21) {
        assert.equal(response.status, 429);
        const payload = (await response.json()) as {
          success: boolean;
          data: null;
          message?: string;
        };

        assert.equal(payload.success, false);
        assert.equal(payload.data, null);
        assert.match(String(payload.message), /Demasiados mensajes enviados/);
      }
    }

    assert.equal(lastStatus, 429);
  });
});
