// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: Category;
  sizes: Size[];
  colors: Color[];
  stock: number;
  featured: boolean;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: 'hombre' | 'mujer' | 'ninos';
  description?: string;
  image?: string;
}

export interface Size {
  id: string;
  name: string;
  available: boolean;
}

export interface Color {
  id: string;
  name: string;
  hex: string;
  available: boolean;
}

// Offer/Promotion Types
export interface Offer {
  id: string;
  title: string;
  description: string;
  discountPercentage: number;
  code?: string;
  image: string;
  validFrom: string;
  validUntil: string;
  active: boolean;
  applicableCategories: Category['slug'][];
}

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'customer' | 'admin';
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface RecoverPasswordData {
  email: string;
}

// Cart and Order Types
export interface CartProductPreview {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  stock: number;
  category: {
    id: string;
    name: string;
    slug: Category['slug'];
  };
}

export interface CartItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sizeName?: string;
  colorName?: string;
  product: CartProductPreview | null;
}

export interface Cart {
  id: string;
  status: 'active' | 'ordered' | 'abandoned';
  items: CartItem[];
  summary: {
    subtotal: number;
    shippingTotal: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sizeName?: string;
  colorName?: string;
}

export interface Order {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// Contact Types
export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// Filter Types
export interface ProductFilters {
  category?: Category['slug'];
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  search?: string;
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'name';
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// UI State Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}
