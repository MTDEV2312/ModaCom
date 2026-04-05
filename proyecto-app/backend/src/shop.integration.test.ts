import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { TestServer } from "./integration-helpers";
import {
  createAddressForUser,
  getFirstVariantWithStock,
  registerAndLoginCustomer,
  startTestServer,
  stopTestServer,
} from "./integration-helpers";

let ctx: TestServer;

before(async () => {
  ctx = await startTestServer();
});

after(async () => {
  await stopTestServer(ctx.server);
});

describe("Shop integration", () => {
  it("should return 404 envelope for unknown route", async () => {
    const response = await fetch(`${ctx.baseUrl}/api/v1/does-not-exist`);
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

  it("should create order from cart for authenticated customer", async () => {
    const session = await registerAndLoginCustomer(ctx.baseUrl, "integration-order");
    const addressId = await createAddressForUser(ctx.baseUrl, session.token);
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
        total: number;
        items: Array<{ id: string; quantity: number }>;
      };
    };

    assert.equal(orderPayload.success, true);
    assert.ok(orderPayload.data.id.length > 0);
    assert.ok(orderPayload.data.total > 0);
    assert.ok(orderPayload.data.items.length > 0);
  });

  it("should reject add-to-cart when requested quantity exceeds variant stock", async () => {
    const session = await registerAndLoginCustomer(ctx.baseUrl, "integration-stock");
    const stockEntry = await getFirstVariantWithStock(ctx.baseUrl);

    const response = await fetch(`${ctx.baseUrl}/api/v1/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify({
        productId: Number(stockEntry.productId),
        quantity: stockEntry.variant.stock + 1,
        sizeName: stockEntry.variant.sizeName,
        colorName: stockEntry.variant.colorName,
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
    assert.match(String(payload.message), /Stock insuficiente/);
  });
});
