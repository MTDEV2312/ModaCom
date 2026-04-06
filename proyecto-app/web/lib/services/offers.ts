import type { Offer, ApiResponse } from '@/types';
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

export async function getOffers(): Promise<ApiResponse<Offer[]>> {
  if (!shouldUseBackend) {
    return {
      data: [],
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Offer[]>>('/offers');
  } catch {
    return {
      data: [],
      success: false,
      message: 'No se pudieron cargar las promociones activas.',
    };
  }
}

export async function getAllOffers(): Promise<ApiResponse<Offer[]>> {
  if (!shouldUseBackend) {
    return {
      data: [],
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Offer[]>>('/offers/all');
  } catch {
    return {
      data: [],
      success: false,
      message: 'No se pudieron cargar todas las promociones.',
    };
  }
}

export async function getOfferById(id: string): Promise<ApiResponse<Offer | null>> {
  if (!shouldUseBackend) {
    return {
      data: null,
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    const response = await fetchFromBackend<ApiResponse<Offer[]>>('/offers/all');
    if (!response.success) {
      return {
        success: false,
        data: null,
        message: response.message || 'No se pudieron cargar las promociones.',
      };
    }

    const found = response.data.find((item) => item.id === id) || null;
    return {
      success: !!found,
      data: found,
      message: found ? undefined : 'Promoción no encontrada',
    };
  } catch {
    return {
      data: null,
      success: false,
      message: 'No se pudo cargar la promoción.',
    };
  }
}

export async function createOffer(offer: Omit<Offer, 'id'>): Promise<ApiResponse<Offer>> {
  if (!shouldUseBackend) {
    return {
      data: null as unknown as Offer,
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Offer>>('/admin/offers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(offer),
    });
  } catch {
    return {
      data: null as unknown as Offer,
      success: false,
      message: 'No se pudo crear la promoción.',
    };
  }
}

export async function updateOffer(id: string, updates: Partial<Offer>): Promise<ApiResponse<Offer>> {
  if (!shouldUseBackend) {
    return {
      data: null as unknown as Offer,
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Offer>>(`/admin/offers/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(updates),
    });
  } catch {
    return {
      data: null as unknown as Offer,
      success: false,
      message: 'No se pudo actualizar la promoción.',
    };
  }
}

export async function deleteOffer(id: string): Promise<ApiResponse<null>> {
  if (!shouldUseBackend) {
    return {
      data: null,
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<null>>(`/admin/offers/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
  } catch {
    return {
      data: null,
      success: false,
      message: 'No se pudo eliminar la promoción.',
    };
  }
}
