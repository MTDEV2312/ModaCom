import type { Address, ApiResponse } from '@/types';
import { getAuthHeader, getStoredUser } from '@/lib/services/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const V1_BASE = `${API_BASE_URL.replace(/\/$/, '')}/api/v1`;
const shouldUseBackend = Boolean(API_BASE_URL);

export async function getMyAddresses(): Promise<ApiResponse<Address[]>> {
  if (shouldUseBackend) {
    try {
      const response = await fetch(`${V1_BASE}/addresses`, {
        headers: {
          ...getAuthHeader(),
        },
        cache: 'no-store',
      });

      return (await response.json()) as ApiResponse<Address[]>;
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
      message: 'Configurá NEXT_PUBLIC_API_URL para crear direcciones.',
    };
  }

  try {
    const response = await fetch(`${V1_BASE}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    return (await response.json()) as ApiResponse<Address>;
  } catch {
    return {
      success: false,
      data: null as unknown as Address,
      message: 'No se pudo crear la dirección.',
    };
  }
}

export async function setDefaultAddress(addressId: string): Promise<ApiResponse<Address>> {
  if (!shouldUseBackend) {
    return {
      success: false,
      data: null as unknown as Address,
      message: 'Configurá NEXT_PUBLIC_API_URL para actualizar direcciones.',
    };
  }

  try {
    const response = await fetch(`${V1_BASE}/addresses/${addressId}/default`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
      },
    });

    return (await response.json()) as ApiResponse<Address>;
  } catch {
    return {
      success: false,
      data: null as unknown as Address,
      message: 'No se pudo actualizar la dirección predeterminada.',
    };
  }
}

export async function removeAddress(addressId: string): Promise<ApiResponse<null>> {
  if (!shouldUseBackend) {
    return {
      success: false,
      data: null,
      message: 'Configurá NEXT_PUBLIC_API_URL para eliminar direcciones.',
    };
  }

  try {
    const response = await fetch(`${V1_BASE}/addresses/${addressId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });

    return (await response.json()) as ApiResponse<null>;
  } catch {
    return {
      success: false,
      data: null,
      message: 'No se pudo eliminar la dirección.',
    };
  }
}
