import { clearAuthSession, getAuthToken, getRefreshToken, getStoredUser, setAuthSession } from '@/lib/services/session';

const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const SERVER_API_BASE_URL = process.env.INTERNAL_API_URL || PUBLIC_API_BASE_URL;
const API_BASE_URL = typeof window === 'undefined' ? SERVER_API_BASE_URL : PUBLIC_API_BASE_URL;
const V1_BASE = `${API_BASE_URL.replace(/\/$/, '')}/api/v1`;

export const shouldUseBackend = Boolean(API_BASE_URL);

export function apiNotConfiguredMessage() {
  return 'NEXT_PUBLIC_API_URL no está configurada para usar servicios reales.';
}

export function buildApiUrl(path: string) {
  return `${V1_BASE}${path}`;
}

export function mergeJsonHeaders(headers?: HeadersInit) {
  return {
    'Content-Type': 'application/json',
    ...(headers ?? {}),
  };
}

function logRequestFailure(scope: string, info: Record<string, unknown>) {
  // Log técnico mínimo para debugging sin exponer payloads sensibles.
  console.error(`[frontend][${scope}]`, info);
}

export class ApiClientError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.payload = payload;
  }
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

function messageFromPayload(payload: unknown, fallbackMessage: string) {
  if (payload && typeof payload === 'object' && 'message' in payload && typeof (payload as { message?: unknown }).message === 'string') {
    return (payload as { message: string }).message;
  }

  return fallbackMessage;
}

async function performJsonRequest(path: string, options?: RequestInit) {
  const response = await fetch(buildApiUrl(path), {
    cache: 'no-store',
    ...(options ?? {}),
  });

  const payload = await readResponseBody(response);
  return { response, payload };
}

export async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const { response, payload } = await performJsonRequest(path, options);
  if (!response.ok) {
    logRequestFailure('http.request', {
      path,
      method: options?.method ?? 'GET',
      status: response.status,
      message: messageFromPayload(payload, `Error HTTP ${response.status}`),
    });
    throw new ApiClientError(
      messageFromPayload(payload, `Error HTTP ${response.status}`),
      response.status,
      payload,
    );
  }

  return payload as T;
}

async function refreshAuthSession() {
  const refreshToken = getRefreshToken();
  const storedUser = getStoredUser();

  if (!refreshToken || !storedUser) {
    return false;
  }

  const { response, payload } = await performJsonRequest('/auth/refresh', {
    method: 'POST',
    headers: mergeJsonHeaders(),
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok || !payload || typeof payload !== 'object' || !('data' in payload)) {
    logRequestFailure('auth.refresh', {
      path: '/auth/refresh',
      method: 'POST',
      status: response.status,
      hasRefreshToken: Boolean(refreshToken),
      message: messageFromPayload(payload, 'No se pudo renovar la sesión.'),
    });
    throw new ApiClientError(messageFromPayload(payload, 'No se pudo renovar la sesión.'), response.status, payload);
  }

  const responsePayload = payload as {
    success?: boolean;
    data?: {
      token?: string;
      refreshToken?: string;
    };
    message?: string;
  };

  if (!responsePayload.success || !responsePayload.data?.token || !responsePayload.data.refreshToken) {
    throw new ApiClientError(messageFromPayload(payload, 'No se pudo renovar la sesión.'), response.status, payload);
  }

  setAuthSession(responsePayload.data.token, storedUser, responsePayload.data.refreshToken);
  return true;
}

function buildAuthHeaders(options?: RequestInit, token?: string | null) {
  return {
    ...(options?.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.replace('/login');
}

export async function requestAuthenticatedJson<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();

  try {
    return await requestJson<T>(path, {
      ...options,
      headers: buildAuthHeaders(options, token),
    });
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 401) {
      throw error;
    }

    logRequestFailure('auth.request-401', {
      path,
      method: options?.method ?? 'GET',
      status: error.status,
    });

    try {
      const refreshed = await refreshAuthSession();
      if (!refreshed) {
        logRequestFailure('auth.refresh-missing', {
          path,
          method: options?.method ?? 'GET',
        });
        clearAuthSession();
        redirectToLogin();
        throw error;
      }

      const refreshedToken = getAuthToken();
      return await requestJson<T>(path, {
        ...options,
        headers: buildAuthHeaders(options, refreshedToken),
      });
    } catch (refreshError) {
      logRequestFailure('auth.refresh-failed', {
        path,
        method: options?.method ?? 'GET',
        reason: refreshError instanceof Error ? refreshError.message : 'unknown',
      });
      clearAuthSession();
      redirectToLogin();
      throw refreshError instanceof Error ? refreshError : error;
    }
  }
}