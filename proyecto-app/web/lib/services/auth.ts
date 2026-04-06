import type { ApiResponse, RecoverPasswordData, RegisterData, User } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const V1_BASE = `${API_BASE_URL.replace(/\/$/, '')}/api/v1`;

export interface LoginResponse {
  token: string;
  user: User;
}

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('moda_token');
}

export function setAuthSession(token: string, user: User) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('moda_token', token);
  window.localStorage.setItem('moda_user', JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('moda_token');
  window.localStorage.removeItem('moda_user');
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('moda_user');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

async function fetchAuth<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${V1_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  return (await response.json()) as T;
}

export async function login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
  return fetchAuth<ApiResponse<LoginResponse>>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data: RegisterData): Promise<ApiResponse<User>> {
  return fetchAuth<ApiResponse<User>>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function recoverPassword(data: RecoverPasswordData): Promise<ApiResponse<null>> {
  return fetchAuth<ApiResponse<null>>('/auth/recover-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function me(): Promise<ApiResponse<User>> {
  const token = getAuthToken();

  return fetchAuth<ApiResponse<User>>('/auth/me', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function getAuthHeader(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

    setAuthSession(token, response.data);
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
