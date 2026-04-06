import type { Address, ApiResponse, Cart, Order } from '@/types';
import { getAuthHeader } from '@/lib/services/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const V1_BASE = `${API_BASE_URL.replace(/\/$/, '')}/api/v1`;
const shouldUseBackend = Boolean(API_BASE_URL);

function apiNotConfiguredMessage() {
  return 'NEXT_PUBLIC_API_URL no está configurada para usar servicios reales.';
}

async function fetchFromBackend<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${V1_BASE}${path}`, {
    cache: 'no-store',
    ...(options ?? {}),
  });

  return (await response.json()) as T;
}

export async function getCart(): Promise<ApiResponse<Cart>> {
  if (!shouldUseBackend) {
    return {
      success: false,
      data: null as unknown as Cart,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Cart>>('/cart', {
      headers: {
        ...getAuthHeader(),
      },
    });
  } catch {
    return {
      success: false,
      data: null as unknown as Cart,
      message: 'No se pudo cargar el carrito.',
    };
  }
}

export async function addToCart(payload: {
  productId: string;
  quantity: number;
  sizeName?: string;
  colorName?: string;
}): Promise<ApiResponse<Cart>> {
  if (!shouldUseBackend) {
    return {
      success: false,
      data: null as unknown as Cart,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Cart>>('/cart/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      success: false,
      data: null as unknown as Cart,
      message: 'No se pudo agregar el producto al carrito.',
    };
  }
}

export async function updateCartItem(itemId: string, quantity: number): Promise<ApiResponse<Cart>> {
  if (!shouldUseBackend) {
    return {
      success: false,
      data: null as unknown as Cart,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Cart>>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ quantity }),
    });
  } catch {
    return {
      success: false,
      data: null as unknown as Cart,
      message: 'No se pudo actualizar el carrito.',
    };
  }
}

export async function removeCartItem(itemId: string): Promise<ApiResponse<Cart>> {
  if (!shouldUseBackend) {
    return {
      success: false,
      data: null as unknown as Cart,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Cart>>(`/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
  } catch {
    return {
      success: false,
      data: null as unknown as Cart,
      message: 'No se pudo eliminar el producto del carrito.',
    };
  }
}

export async function clearCart(): Promise<ApiResponse<null>> {
  if (!shouldUseBackend) {
    return {
      success: false,
      data: null,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<null>>('/cart', {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
  } catch {
    return {
      success: false,
      data: null,
      message: 'No se pudo vaciar el carrito.',
    };
  }
}

async function resolveDefaultAddressId(): Promise<string | null> {
  if (!shouldUseBackend) {
    return null;
  }

  try {
    const response = await fetch(`${V1_BASE}/addresses`, {
      headers: {
        ...getAuthHeader(),
      },
      cache: 'no-store',
    });

    const payload = (await response.json()) as ApiResponse<Address[]>;
    if (!payload.success || !Array.isArray(payload.data) || payload.data.length === 0) {
      return null;
    }

    const preferred = payload.data.find((address) => address.isDefault) ?? payload.data[0];
    return preferred?.id ?? null;
  } catch {
    return null;
  }
}

export async function createOrderFromCart(addressId?: string): Promise<ApiResponse<Order>> {
  if (!shouldUseBackend) {
    return {
      success: false,
      data: null as unknown as Order,
      message: apiNotConfiguredMessage(),
    };
  }

  const resolvedAddressId = addressId ?? (await resolveDefaultAddressId());
  if (!resolvedAddressId) {
    return {
      success: false,
      data: null as unknown as Order,
      message: 'Necesitás una dirección guardada para crear el pedido.',
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Order>>('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ addressId: resolvedAddressId }),
    });
  } catch {
    return {
      success: false,
      data: null as unknown as Order,
      message: 'No se pudo crear el pedido.',
    };
  }
}

export async function getMyOrders(): Promise<ApiResponse<Order[]>> {
  if (!shouldUseBackend) {
    return {
      success: false,
      data: [],
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Order[]>>('/orders', {
      headers: {
        ...getAuthHeader(),
      },
    });
  } catch {
    return {
      success: false,
      data: [],
      message: 'No se pudieron cargar los pedidos.',
    };
  }
}
