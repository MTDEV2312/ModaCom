import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { TestServer } from "./integration-helpers";
import {
  loginAdmin,
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

  it("should list offers once and respect includeInactive", async () => {
    const adminToken = await loginAdmin(ctx.baseUrl);
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const createdOfferIds: string[] = [];

    const createOffer = async (payload: {
      title: string;
      description: string;
      discountPercentage: number;
      code: string;
      image: string;
      validFrom: string;
      validUntil: string;
      active: boolean;
      applicableCategories: string[];
    }) => {
      const response = await fetch(`${ctx.baseUrl}/api/v1/admin/offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      assert.equal(response.status, 201);

      const result = (await response.json()) as {
        success: boolean;
        data: { id: string; title: string };
      };

      assert.equal(result.success, true);
      assert.ok(result.data.id.length > 0);
      createdOfferIds.push(result.data.id);
      return result.data;
    };

    try {
      const activeFutureOffer = await createOffer({
        title: `Oferta activa futura ${suffix}`,
        description: "Oferta activa usada para validar el orden",
        discountPercentage: 25,
        code: `ACTIVE${suffix}`,
        image: "/images/offers/active-future.jpg",
        validFrom: "2026-01-01T00:00:00.000Z",
        validUntil: "2032-01-01T00:00:00.000Z",
        active: true,
        applicableCategories: ["hombre"],
      });

      const inactiveFutureOffer = await createOffer({
        title: `Oferta inactiva futura ${suffix}`,
        description: "Oferta inactiva usada para validar includeInactive",
        discountPercentage: 30,
        code: `INACTIVE${suffix}`,
        image: "/images/offers/inactive-future.jpg",
        validFrom: "2026-01-01T00:00:00.000Z",
        validUntil: "2033-01-01T00:00:00.000Z",
        active: false,
        applicableCategories: ["mujer"],
      });

      const anotherActiveOffer = await createOffer({
        title: `Oferta activa secundaria ${suffix}`,
        description: "Oferta activa adicional para confirmar el orden por fecha",
        discountPercentage: 15,
        code: `SECONDARY${suffix}`,
        image: "/images/offers/active-secondary.jpg",
        validFrom: "2026-01-01T00:00:00.000Z",
        validUntil: "2031-01-01T00:00:00.000Z",
        active: true,
        applicableCategories: ["ninos"],
      });

      const defaultResponse = await fetch(`${ctx.baseUrl}/api/v1/offers/all`);
      assert.equal(defaultResponse.status, 200);

      const defaultPayload = (await defaultResponse.json()) as {
        success: boolean;
        data: Array<{ id: string; title: string; active: boolean; validUntil: string }>;
      };

      assert.equal(defaultPayload.success, true);
      assert.ok(defaultPayload.data.length >= 3);

      const defaultTitles = defaultPayload.data.map((offer) => offer.title);
      assert.ok(defaultTitles.includes(activeFutureOffer.title));
      assert.ok(defaultTitles.includes(anotherActiveOffer.title));
      assert.ok(!defaultTitles.includes(inactiveFutureOffer.title));
      assert.ok(defaultTitles.indexOf(activeFutureOffer.title) < defaultTitles.indexOf(anotherActiveOffer.title));

      const includeInactiveResponse = await fetch(`${ctx.baseUrl}/api/v1/offers/all?includeInactive=true`);
      assert.equal(includeInactiveResponse.status, 200);

      const includeInactivePayload = (await includeInactiveResponse.json()) as {
        success: boolean;
        data: Array<{ id: string; title: string; active: boolean; validUntil: string }>;
      };

      assert.equal(includeInactivePayload.success, true);
      assert.ok(includeInactivePayload.data.length >= 4);

      const includeInactiveTitles = includeInactivePayload.data.map((offer) => offer.title);
      assert.ok(includeInactiveTitles.includes(inactiveFutureOffer.title));
      assert.equal(includeInactiveTitles[0], inactiveFutureOffer.title);
      assert.ok(includeInactiveTitles.indexOf(activeFutureOffer.title) < includeInactiveTitles.indexOf(anotherActiveOffer.title));
    } finally {
      for (const offerId of createdOfferIds.reverse()) {
        await fetch(`${ctx.baseUrl}/api/v1/admin/offers/${offerId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
      }
    }
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
