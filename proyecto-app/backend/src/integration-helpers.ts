import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { app } from "./server";

export type TestServer = {
  server: ReturnType<typeof app.listen>;
  baseUrl: string;
};

export async function startTestServer(): Promise<TestServer> {
  const server = app.listen(0);
  await new Promise<void>((resolve) => {
    server.once("listening", () => resolve());
  });

  const address = server.address() as AddressInfo;
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

export async function stopTestServer(server: ReturnType<typeof app.listen>) {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export async function registerAndLoginCustomer(baseUrl: string, prefix: string) {
  const email = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = "password123";

  const registerResponse = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      confirmPassword: password,
      firstName: "Integration",
      lastName: "Test",
      acceptTerms: true,
    }),
  });

  assert.equal(registerResponse.status, 201);

  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
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

  return {
    email,
    token: loginPayload.data.token,
    refreshToken: loginPayload.data.refreshToken,
  };
}

export async function loginAdmin(baseUrl: string) {
  const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "admin@moda.com",
      password: "admin123",
    }),
  });

  assert.equal(loginResponse.status, 200);

  const loginPayload = (await loginResponse.json()) as {
    success: boolean;
    data: {
      token: string;
      user: {
        role: "customer" | "admin";
      };
    };
  };

  assert.equal(loginPayload.success, true);
  assert.equal(loginPayload.data.user.role, "admin");
  return loginPayload.data.token;
}

export async function createAddressForUser(baseUrl: string, token: string) {
  const response = await fetch(`${baseUrl}/api/v1/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      street: "Calle Falsa 123",
      city: "Madrid",
      state: "Madrid",
      postalCode: "28001",
      country: "Espana",
      isDefault: true,
    }),
  });

  assert.equal(response.status, 201);

  const payload = (await response.json()) as {
    success: boolean;
    data: {
      id: string;
      isDefault: boolean;
    };
  };

  assert.equal(payload.success, true);
  assert.equal(payload.data.isDefault, true);
  return payload.data.id;
}

export async function getFirstVariantWithStock(baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/v1/products?page=1&pageSize=24`);
  assert.equal(response.status, 200);

  const payload = (await response.json()) as {
    success: boolean;
    data: Array<{
      id: string;
      variants: Array<{
        id: string;
        sizeName: string;
        colorName: string;
        stock: number;
      }>;
    }>;
  };

  assert.equal(payload.success, true);

  for (const product of payload.data) {
    const variant = product.variants.find((entry) => entry.stock > 0);
    if (variant) {
      return {
        productId: product.id,
        variant,
      };
    }
  }

  const adminToken = await loginAdmin(baseUrl);
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const createResponse = await fetch(`${baseUrl}/api/v1/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: `Producto Stock Test ${suffix}`,
      description: "Producto auxiliar para pruebas de integración",
      price: 99.9,
      categorySlug: "hombre",
      stock: 50,
      images: ["/images/placeholder-product.jpg"],
      variants: [
        {
          sizeName: "M",
          colorName: "Negro",
          stock: 50,
          isActive: true,
        },
      ],
    }),
  });

  assert.equal(createResponse.status, 201);

  const createPayload = (await createResponse.json()) as {
    success: boolean;
    data: {
      id: string;
      variants: Array<{
        id: string;
        sizeName: string;
        colorName: string;
        stock: number;
      }>;
    };
  };

  assert.equal(createPayload.success, true);
  const createdVariant = createPayload.data.variants.find((entry) => entry.stock > 0);
  assert.ok(createdVariant);

  return {
    productId: createPayload.data.id,
    variant: createdVariant,
  };
}
