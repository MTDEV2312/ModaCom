import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { TestServer } from "./integration-helpers";
import { registerAndLoginCustomer, startTestServer, stopTestServer } from "./integration-helpers";

let ctx: TestServer;

before(async () => {
  ctx = await startTestServer();
});

after(async () => {
  await stopTestServer(ctx.server);
});

describe("Auth integration", () => {
  it("should complete auth flow: register -> login -> me", async () => {
    const session = await registerAndLoginCustomer(ctx.baseUrl, "integration-auth");

    const meResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
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
    assert.equal(mePayload.data.email, session.email);
    assert.equal(mePayload.data.firstName, "Integration");
    assert.equal(mePayload.data.lastName, "Test");
  });

  it("should complete auth refresh and logout lifecycle", async () => {
    const session = await registerAndLoginCustomer(ctx.baseUrl, "integration-refresh");

    const refreshResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: session.refreshToken,
      }),
    });

    assert.equal(refreshResponse.status, 200);

    const refreshPayload = (await refreshResponse.json()) as {
      success: boolean;
      data: {
        token: string;
        refreshToken: string;
      };
    };

    assert.equal(refreshPayload.success, true);
    assert.ok(refreshPayload.data.token.length > 20);
    assert.ok(refreshPayload.data.refreshToken.length > 20);

    const logoutResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: refreshPayload.data.refreshToken,
      }),
    });

    assert.equal(logoutResponse.status, 200);

    const postLogoutRefreshResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: refreshPayload.data.refreshToken,
      }),
    });

    assert.equal(postLogoutRefreshResponse.status, 401);

    const postLogoutRefreshPayload = (await postLogoutRefreshResponse.json()) as {
      success: boolean;
      data: null;
      message?: string;
    };

    assert.equal(postLogoutRefreshPayload.success, false);
    assert.equal(postLogoutRefreshPayload.data, null);
    assert.match(String(postLogoutRefreshPayload.message), /Refresh token inválido|Refresh token invalido/i);
  });

  it("should reset password and invalidate previous credentials", async () => {
    const email = `integration-reset-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;

    const registerResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "password123",
        confirmPassword: "password123",
        firstName: "Reset",
        lastName: "Case",
        acceptTerms: true,
      }),
    });

    assert.equal(registerResponse.status, 201);

    const recoverResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/recover-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    });

    assert.equal(recoverResponse.status, 200);
    const recoverPayload = (await recoverResponse.json()) as {
      success: boolean;
      data: {
        resetToken?: string;
      } | null;
    };

    assert.equal(recoverPayload.success, true);
    const resetToken = recoverPayload.data?.resetToken;
    assert.ok(resetToken);

    const resetResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: resetToken,
        password: "password456",
        confirmPassword: "password456",
      }),
    });

    assert.equal(resetResponse.status, 200);

    const oldLoginResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "password123",
      }),
    });

    assert.equal(oldLoginResponse.status, 401);

    const newLoginResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "password456",
      }),
    });

    assert.equal(newLoginResponse.status, 200);

    const resetReuseResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: resetToken,
        password: "password789",
        confirmPassword: "password789",
      }),
    });

    assert.equal(resetReuseResponse.status, 400);
  });
});
