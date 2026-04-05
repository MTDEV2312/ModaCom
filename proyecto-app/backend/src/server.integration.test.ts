import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { app } from "./server";

let server: ReturnType<typeof app.listen>;
let baseUrl = "";

before(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => {
    server.once("listening", () => resolve());
  });

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

describe("API integration smoke", () => {
  it("should return 404 envelope for unknown route", async () => {
    const response = await fetch(`${baseUrl}/api/v1/does-not-exist`);
    assert.equal(response.status, 404);

    const payload = (await response.json()) as {
      success: boolean;
      data: null;
      message?: string;
    };

    assert.equal(payload.success, false);
    assert.equal(payload.data, null);
    assert.match(String(payload.message), /Ruta no encontrada/);
  });

  it("should reject admin route without token", async () => {
    const response = await fetch(`${baseUrl}/api/v1/admin/categories`);
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

  it("should complete auth flow: register -> login -> me", async () => {
    const email = `integration-${Date.now()}@example.com`;

    const registerResponse = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "password123",
        confirmPassword: "password123",
        firstName: "Integration",
        lastName: "Test",
        acceptTerms: true,
      }),
    });

    assert.equal(registerResponse.status, 201);
    const registerPayload = (await registerResponse.json()) as {
      success: boolean;
      data: {
        id: string;
        email: string;
        role: "customer" | "admin";
      };
    };

    assert.equal(registerPayload.success, true);
    assert.equal(registerPayload.data.email, email);
    assert.equal(registerPayload.data.role, "customer");

    const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "password123",
      }),
    });

    assert.equal(loginResponse.status, 200);
    const loginPayload = (await loginResponse.json()) as {
      success: boolean;
      data: {
        token: string;
        refreshToken: string;
      };
    };

    assert.equal(loginPayload.success, true);
    assert.ok(loginPayload.data.token.length > 20);
    assert.ok(loginPayload.data.refreshToken.length > 20);

    const meResponse = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${loginPayload.data.token}`,
      },
    });

    assert.equal(meResponse.status, 200);
    const mePayload = (await meResponse.json()) as {
      success: boolean;
      data: {
        email: string;
        firstName: string;
        lastName: string;
      };
    };

    assert.equal(mePayload.success, true);
    assert.equal(mePayload.data.email, email);
    assert.equal(mePayload.data.firstName, "Integration");
    assert.equal(mePayload.data.lastName, "Test");
  });
});
