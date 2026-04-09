import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { TestServer } from "./integration-helpers";
import { createAddressForUser, getFirstVariantWithStock, registerAndLoginCustomer, startTestServer, stopTestServer } from "./integration-helpers";
import { setEmailSenderForTests } from "./services/email";

let ctx: TestServer;

before(async () => {
  ctx = await startTestServer();
});

after(async () => {
  await stopTestServer(ctx.server);
});

describe("User flow integration", () => {
  it("should complete purchase flow: register/login -> catalog -> cart -> order -> orders list", async () => {
    const session = await registerAndLoginCustomer(ctx.baseUrl, "integration-user-flow");
    const addressId = await createAddressForUser(ctx.baseUrl, session.token);

    const catalogResponse = await fetch(`${ctx.baseUrl}/api/v1/products?page=1&pageSize=24`);
    assert.equal(catalogResponse.status, 200);

    const stockEntry = await getFirstVariantWithStock(ctx.baseUrl);

    const addItemResponse = await fetch(`${ctx.baseUrl}/api/v1/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        productId: Number(stockEntry.productId),
        quantity: 1,
        sizeName: stockEntry.variant.sizeName,
        colorName: stockEntry.variant.colorName,
      }),
    });

    assert.equal(addItemResponse.status, 200);

    const cartResponse = await fetch(`${ctx.baseUrl}/api/v1/cart`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    assert.equal(cartResponse.status, 200);

    const cartPayload = (await cartResponse.json()) as {
      success: boolean;
      data: {
        items: Array<{ id: string; quantity: number }>;
      };
    };

    assert.equal(cartPayload.success, true);
    assert.ok(cartPayload.data.items.length > 0);

    const orderResponse = await fetch(`${ctx.baseUrl}/api/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        addressId: Number(addressId),
      }),
    });

    assert.equal(orderResponse.status, 201);

    const orderPayload = (await orderResponse.json()) as {
      success: boolean;
      data: {
        id: string;
      };
    };

    assert.equal(orderPayload.success, true);
    assert.ok(orderPayload.data.id.length > 0);

    const ordersResponse = await fetch(`${ctx.baseUrl}/api/v1/orders`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    assert.equal(ordersResponse.status, 200);

    const ordersPayload = (await ordersResponse.json()) as {
      success: boolean;
      data: Array<{ id: string }>;
    };

    assert.equal(ordersPayload.success, true);
    assert.ok(ordersPayload.data.some((order) => order.id === orderPayload.data.id));
  });

  it("should complete auth lifecycle: refresh/logout/recover/reset", async () => {
    const session = await registerAndLoginCustomer(ctx.baseUrl, "integration-user-auth-lifecycle");
    let resetTokenFromEmail: string | undefined;

    setEmailSenderForTests(async (payload) => {
      const resetUrlLine = payload.text.split("\n").find((line) => line.includes("token="));
      if (resetUrlLine) {
        const urlMatch = resetUrlLine.match(/https?:\/\/\S+/);
        if (urlMatch) {
          const token = new URL(urlMatch[0]).searchParams.get("token");
          if (token) {
            resetTokenFromEmail = token;
          }
        }
      }

      return { id: `integration-user-flow-reset-${Date.now()}` };
    });

    try {

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

    const refreshAfterLogoutResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: refreshPayload.data.refreshToken,
      }),
    });

    assert.equal(refreshAfterLogoutResponse.status, 401);

    const recoverResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/recover-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.email,
      }),
    });

    assert.equal(recoverResponse.status, 200);

    const recoverPayload = (await recoverResponse.json()) as {
      success: boolean;
      data: null;
    };

    assert.equal(recoverPayload.success, true);
    const resetToken = resetTokenFromEmail;
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

    const oldPasswordLoginResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.email,
        password: "password123",
      }),
    });

    assert.equal(oldPasswordLoginResponse.status, 401);

    const newPasswordLoginResponse = await fetch(`${ctx.baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.email,
        password: "password456",
      }),
    });

    assert.equal(newPasswordLoginResponse.status, 200);
    } finally {
      setEmailSenderForTests(null);
    }
  });
});
