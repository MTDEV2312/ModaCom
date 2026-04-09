import type { User } from '@/types';

const AUTH_TOKEN_KEY = 'moda_token';
const AUTH_REFRESH_TOKEN_KEY = 'moda_refresh_token';
const AUTH_USER_KEY = 'moda_user';

function getWindowStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function getAuthToken() {
  const storage = getWindowStorage();
  return storage ? storage.getItem(AUTH_TOKEN_KEY) : null;
}

export function getRefreshToken() {
  const storage = getWindowStorage();
  return storage ? storage.getItem(AUTH_REFRESH_TOKEN_KEY) : null;
}

export function setAuthSession(token: string, user: User, refreshToken?: string | null) {
  const storage = getWindowStorage();
  if (!storage) return;

  storage.setItem(AUTH_TOKEN_KEY, token);
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user));

  if (refreshToken === undefined) {
    return;
  }

  if (refreshToken) {
    storage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
  } else {
    storage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  }
}

export function clearAuthSession() {
  const storage = getWindowStorage();
  if (!storage) return;

  storage.removeItem(AUTH_TOKEN_KEY);
  storage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  storage.removeItem(AUTH_USER_KEY);
}

export function getStoredUser(): User | null {
  const storage = getWindowStorage();
  if (!storage) return null;

  const raw = storage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}