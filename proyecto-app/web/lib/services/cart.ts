import type { Address, ApiResponse, Cart, Order } from '@/types';
import { getAuthHeader } from '@/lib/services/auth';
import { apiNotConfiguredMessage, mergeJsonHeaders, requestAuthenticatedJson, requestJson, shouldUseBackend, ApiClientError } from '@/lib/services/http-client';

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    switch (error.status) {
      case 401:
        return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      case 404:
        return 'El producto o carrito no fue encontrado.';
      case 409:
        return error.message || 'Stock insuficiente para completar esta acción.';
      case 500:
        return 'Error del servidor. Por favor intenta más tarde.';
      default:
        return error.message || fallback;
    }
  }
  return error instanceof Error ? error.message : fallback;
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
    return await requestAuthenticatedJson<ApiResponse<Cart>>('/cart', {
      headers: {
        ...getAuthHeader(),
      },
    });
  } catch (error) {
    return {
      success: false,
      data: null as unknown as Cart,
      message: errorMessage(error, 'No se pudo cargar el carrito.'),
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
    return await requestAuthenticatedJson<ApiResponse<Cart>>('/cart/items', {
      method: 'POST',
      headers: mergeJsonHeaders(getAuthHeader()),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return {
      success: false,
      data: null as unknown as Cart,
      message: errorMessage(error, 'No se pudo agregar el producto al carrito.'),
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
    return await requestAuthenticatedJson<ApiResponse<Cart>>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: mergeJsonHeaders(getAuthHeader()),
      body: JSON.stringify({ quantity }),
    });
  } catch (error) {
    return {
      success: false,
      data: null as unknown as Cart,
      message: errorMessage(error, 'No se pudo actualizar el carrito.'),
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
    return await requestAuthenticatedJson<ApiResponse<Cart>>(`/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
  } catch (error) {
    return {
      success: false,
      data: null as unknown as Cart,
      message: errorMessage(error, 'No se pudo eliminar el producto del carrito.'),
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
    return await requestAuthenticatedJson<ApiResponse<null>>('/cart', {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
  } catch (error) {
    return {
      success: false,
      data: null,
      message: errorMessage(error, 'No se pudo vaciar el carrito.'),
    };
  }
}

async function resolveDefaultAddressId(): Promise<string | null> {
  if (!shouldUseBackend) {
    return null;
  }

  try {
    const response = await requestAuthenticatedJson<ApiResponse<Address[]>>('/addresses', {
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!response.success || !Array.isArray(response.data) || response.data.length === 0) {
      return null;
    }

    const preferred = response.data.find((address) => address.isDefault) ?? response.data[0];
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
    return await requestAuthenticatedJson<ApiResponse<Order>>('/orders', {
      method: 'POST',
      headers: mergeJsonHeaders(getAuthHeader()),
      body: JSON.stringify({ addressId: resolvedAddressId }),
    });
  } catch (error) {
    return {
      success: false,
      data: null as unknown as Order,
      message: errorMessage(error, 'No se pudo crear el pedido.'),
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
    return await requestAuthenticatedJson<ApiResponse<Order[]>>('/orders', {
      headers: {
        ...getAuthHeader(),
      },
    });
  } catch (error) {
    return {
      success: false,
      data: [],
      message: errorMessage(error, 'No se pudieron cargar los pedidos.'),
    };
  }
}
