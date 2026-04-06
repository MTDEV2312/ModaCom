import type { Product, ProductFilters, PaginatedResponse, ApiResponse, Category } from '@/types';
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

export async function getProducts(
  filters?: ProductFilters,
  page = 1,
  pageSize = 12
): Promise<PaginatedResponse<Product>> {
  if (!shouldUseBackend) {
    return {
      success: false,
      data: [],
      message: apiNotConfiguredMessage(),
      pagination: {
        page,
        pageSize,
        totalItems: 0,
        totalPages: 1,
      },
    };
  }

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  if (filters?.category) params.set('category', filters.category);
  if (filters?.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters?.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  if (filters?.search) params.set('search', filters.search);
  if (filters?.sizes?.length) params.set('sizes', filters.sizes.join(','));
  if (filters?.colors?.length) params.set('colors', filters.colors.join(','));
  if (filters?.sortBy) params.set('sortBy', filters.sortBy);

  try {
    return await fetchFromBackend<PaginatedResponse<Product>>(`/products?${params.toString()}`);
  } catch {
    return {
      success: false,
      data: [],
      message: 'No se pudieron cargar los productos.',
      pagination: {
        page,
        pageSize,
        totalItems: 0,
        totalPages: 1,
      },
    };
  }
}

export async function getProductBySlug(slug: string): Promise<ApiResponse<Product | null>> {
  if (!shouldUseBackend) {
    return {
      data: null,
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Product | null>>(`/products/${slug}`);
  } catch {
    return {
      data: null,
      success: false,
      message: 'No se pudo cargar el producto.',
    };
  }
}

export async function getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
  if (!shouldUseBackend) {
    return {
      data: [],
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Product[]>>('/products/featured');
  } catch {
    return {
      data: [],
      success: false,
      message: 'No se pudieron cargar los productos destacados.',
    };
  }
}

export async function getNewArrivals(): Promise<ApiResponse<Product[]>> {
  if (!shouldUseBackend) {
    return {
      data: [],
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Product[]>>('/products/new-arrivals');
  } catch {
    return {
      data: [],
      success: false,
      message: 'No se pudieron cargar los nuevos ingresos.',
    };
  }
}

export async function getCategories(): Promise<ApiResponse<Category[]>> {
  if (!shouldUseBackend) {
    return {
      data: [],
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Category[]>>('/categories');
  } catch {
    return {
      data: [],
      success: false,
      message: 'No se pudieron cargar las categorías.',
    };
  }
}

// Admin CRUD operations
export async function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> {
  if (!shouldUseBackend) {
    return {
      data: null as unknown as Product,
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Product>>('/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        categorySlug: product.category.slug,
        stock: product.stock,
        featured: product.featured,
        isNew: product.isNew,
        images: product.images,
      }),
    });
  } catch {
    return {
      data: null as unknown as Product,
      success: false,
      message: 'No se pudo crear el producto.',
    };
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> {
  if (!shouldUseBackend) {
    return {
      data: null as unknown as Product,
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Product>>(`/admin/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        name: updates.name,
        description: updates.description,
        price: updates.price,
        originalPrice: updates.originalPrice,
        categorySlug: updates.category?.slug,
        stock: updates.stock,
        featured: updates.featured,
        isNew: updates.isNew,
      }),
    });
  } catch {
    return {
      data: null as unknown as Product,
      success: false,
      message: 'No se pudo actualizar el producto.',
    };
  }
}

export async function deleteProduct(id: string): Promise<ApiResponse<null>> {
  if (!shouldUseBackend) {
    return {
      data: null,
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<null>>(`/admin/products/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
  } catch {
    return {
      data: null,
      success: false,
      message: 'No se pudo eliminar el producto.',
    };
  }
}

export async function getAdminCategories(): Promise<ApiResponse<Category[]>> {
  if (!shouldUseBackend) {
    return {
      data: [],
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Category[]>>('/admin/categories', {
      headers: {
        ...getAuthHeader(),
      },
    });
  } catch {
    return {
      data: [],
      success: false,
      message: 'No se pudieron cargar las categorías admin.',
    };
  }
}

export async function createCategory(category: Omit<Category, 'id'> & { isActive?: boolean }): Promise<ApiResponse<Category>> {
  if (!shouldUseBackend) {
    return {
      data: null as unknown as Category,
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Category>>('/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(category),
    });
  } catch {
    return {
      data: null as unknown as Category,
      success: false,
      message: 'No se pudo crear la categoría.',
    };
  }
}

export async function updateCategory(id: string, updates: Partial<Category> & { isActive?: boolean }): Promise<ApiResponse<Category>> {
  if (!shouldUseBackend) {
    return {
      data: null as unknown as Category,
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<Category>>(`/admin/categories/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(updates),
    });
  } catch {
    return {
      data: null as unknown as Category,
      success: false,
      message: 'No se pudo actualizar la categoría.',
    };
  }
}

export async function deleteCategory(id: string): Promise<ApiResponse<null>> {
  if (!shouldUseBackend) {
    return {
      data: null,
      success: false,
      message: apiNotConfiguredMessage(),
    };
  }

  try {
    return await fetchFromBackend<ApiResponse<null>>(`/admin/categories/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
  } catch {
    return {
      data: null,
      success: false,
      message: 'No se pudo eliminar la categoría.',
    };
  }
}
