import type { ApiResponse, RecoverPasswordData, RegisterData, User } from '@/types';
import { apiNotConfiguredMessage, mergeJsonHeaders, requestAuthenticatedJson, requestJson, shouldUseBackend } from '@/lib/services/http-client';
import { clearAuthSession, getAuthToken, getStoredUser, getRefreshToken, setAuthSession } from '@/lib/services/session';

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export async function login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
  if (!shouldUseBackend) {
    return { data: null as unknown as LoginResponse, success: false, message: apiNotConfiguredMessage() };
  }

  try {
    return await requestJson<ApiResponse<LoginResponse>>('/auth/login', {
      method: 'POST',
      headers: mergeJsonHeaders(),
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    return {
      data: null as unknown as LoginResponse,
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo iniciar sesión.',
    };
  }
}

export async function register(data: RegisterData): Promise<ApiResponse<User>> {
  if (!shouldUseBackend) {
    return { data: null as unknown as User, success: false, message: apiNotConfiguredMessage() };
  }

  try {
    return await requestJson<ApiResponse<User>>('/auth/register', {
      method: 'POST',
      headers: mergeJsonHeaders(),
      body: JSON.stringify(data),
    });
  } catch (error) {
    return {
      data: null as unknown as User,
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo crear la cuenta.',
    };
  }
}

export async function recoverPassword(data: RecoverPasswordData): Promise<ApiResponse<null>> {
  if (!shouldUseBackend) {
    return { data: null, success: false, message: apiNotConfiguredMessage() };
  }

  try {
    return await requestJson<ApiResponse<null>>('/auth/recover-password', {
      method: 'POST',
      headers: mergeJsonHeaders(),
      body: JSON.stringify(data),
    });
  } catch (error) {
    return {
      data: null,
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo solicitar la recuperación.',
    };
  }
}

export async function me(): Promise<ApiResponse<User>> {
  if (!shouldUseBackend) {
    return { data: null as unknown as User, success: false, message: apiNotConfiguredMessage() };
  }

  try {
    return await requestAuthenticatedJson<ApiResponse<User>>('/auth/me', {
      method: 'GET',
    });
  } catch (error) {
    return {
      data: null as unknown as User,
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo cargar el usuario.',
    };
  }
}

export function getAuthHeader(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export { clearAuthSession, getStoredUser, setAuthSession, getRefreshToken };

export async function resolveCurrentUser(): Promise<User | null> {
  const cached = getStoredUser();
  const token = getAuthToken();

  if (!token) {
    return cached;
  }

  try {
    const response = await me();
    if (!response.success || !response.data) {
      clearAuthSession();
      return null;
    }

    setAuthSession(token, response.data, getRefreshToken() ?? undefined);
    return response.data;
  } catch {
    clearAuthSession();
    return null;
  }
}

export async function ensureCustomerUser(): Promise<User | null> {
  const user = await resolveCurrentUser();
  if (!user || user.role !== 'customer') {
    return null;
  }

  return user;
}
