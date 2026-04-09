import type { Address, ApiResponse } from '@/types';
import { getAuthHeader, getStoredUser } from '@/lib/services/auth';
import { apiNotConfiguredMessage, requestAuthenticatedJson, requestJson, shouldUseBackend } from '@/lib/services/http-client';

export async function getMyAddresses(): Promise<ApiResponse<Address[]>> {
  if (shouldUseBackend) {
    try {
      const response = await requestAuthenticatedJson<ApiResponse<Address[]>>('/addresses', {
        headers: {
          ...getAuthHeader(),
        },
      });

      return response;
    } catch {
      // fallback to local cached user
    }
  }

  const cached = getStoredUser();
  return {
    success: true,
    data: cached?.addresses ?? [],
  };
}

export type AddressInput = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

export async function createAddress(payload: AddressInput): Promise<ApiResponse<Address>> {
  if (!shouldUseBackend) {
    return {
      success: false,
      data: null as unknown as Address,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    const response = await requestAuthenticatedJson<ApiResponse<Address>>('/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    return response;
  } catch (error) {
    return {
      success: false,
      data: null as unknown as Address,
      message: error instanceof Error ? error.message : 'No se pudo crear la dirección.',
    };
  }
}

export async function setDefaultAddress(addressId: string): Promise<ApiResponse<Address>> {
  if (!shouldUseBackend) {
    return {
      success: false,
      data: null as unknown as Address,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    const response = await requestAuthenticatedJson<ApiResponse<Address>>(`/addresses/${addressId}/default`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
      },
    });

    return response;
  } catch (error) {
    return {
      success: false,
      data: null as unknown as Address,
      message: error instanceof Error ? error.message : 'No se pudo actualizar la dirección predeterminada.',
    };
  }
}

export async function removeAddress(addressId: string): Promise<ApiResponse<null>> {
  if (!shouldUseBackend) {
    return {
      success: false,
      data: null,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    const response = await requestAuthenticatedJson<ApiResponse<null>>(`/addresses/${addressId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });

    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'No se pudo eliminar la dirección.',
    };
  }
}
