import type { Offer, ApiResponse } from '@/types';
import { getAuthHeader } from '@/lib/services/auth';
import { apiNotConfiguredMessage, mergeJsonHeaders, requestAuthenticatedJson, requestJson, shouldUseBackend } from '@/lib/services/http-client';

export async function getOffers(): Promise<ApiResponse<Offer[]>> {
  if (!shouldUseBackend) {
    return {
      data: [],
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await requestJson<ApiResponse<Offer[]>>('/offers');
  } catch (error) {
    return {
      data: [],
      success: false,
      message: error instanceof Error ? error.message : 'No se pudieron cargar las promociones activas.',
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
    return await requestJson<ApiResponse<Offer[]>>('/offers/all');
  } catch (error) {
    return {
      data: [],
      success: false,
      message: error instanceof Error ? error.message : 'No se pudieron cargar todas las promociones.',
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
    const response = await requestJson<ApiResponse<Offer[]>>('/offers/all');
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
    return await requestAuthenticatedJson<ApiResponse<Offer>>('/admin/offers', {
      method: 'POST',
      headers: mergeJsonHeaders(getAuthHeader()),
      body: JSON.stringify(offer),
    });
  } catch (error) {
    return {
      data: null as unknown as Offer,
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo crear la promoción.',
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
    return await requestAuthenticatedJson<ApiResponse<Offer>>(`/admin/offers/${id}`, {
      method: 'PATCH',
      headers: mergeJsonHeaders(getAuthHeader()),
      body: JSON.stringify(updates),
    });
  } catch (error) {
    return {
      data: null as unknown as Offer,
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo actualizar la promoción.',
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
    return await requestAuthenticatedJson<ApiResponse<null>>(`/admin/offers/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
  } catch (error) {
    return {
      data: null,
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo eliminar la promoción.',
    };
  }
}
