import type { Product } from '@/types';

const FAVORITES_KEY = 'moda_favorites';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function getFavoriteProductIds(): string[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const raw = storage.getItem(FAVORITES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => typeof item === 'string');
  } catch {
    return [];
  }
}

export function isProductFavorite(productId: string): boolean {
  return getFavoriteProductIds().includes(productId);
}

export function toggleProductFavorite(productId: string): boolean {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  const current = getFavoriteProductIds();
  const exists = current.includes(productId);
  const next = exists ? current.filter((id) => id !== productId) : [...current, productId];

  storage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return !exists;
}

export function getFavoriteProducts(products: Product[]): Product[] {
  const ids = new Set(getFavoriteProductIds());
  return products.filter((product) => ids.has(product.id));
}
