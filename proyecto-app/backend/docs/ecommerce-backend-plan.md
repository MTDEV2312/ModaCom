# Ecommerce Backend Plan (ModaCom)

## 1) Current State Analysis

- The Next.js frontend is structurally complete but currently wired to mock services.
- Typed frontend contracts are defined in `web/types/index.ts` and should be treated as source of truth for API contracts.
- Current backend in `backend/src` is not aligned to ecommerce domain (health + SSD resources).
- A second legacy backend exists in `servidor/server.js`, also not aligned to full typed contracts.

## 2) Front Types -> Backend Domain Mapping

### Product
Frontend type:
- id, name, slug, description, price, originalPrice?, images[], category, sizes[], colors[], stock, featured, isNew, createdAt, updatedAt

Backend entities:
- products
- categories
- product_images
- sizes
- colors
- product_variants (size+color+stock per combination)

Rationale:
- `sizes[]` and `colors[]` in frontend indicate availability. This should come from variants stock > 0, not static booleans.

### Category
Frontend type:
- id, name, slug: hombre | mujer | ninos, description?, image?

Backend:
- categories with enum-like slug constraint and unique slug.

### Offer
Frontend type:
- title, description, discountPercentage, code?, image, validFrom, validUntil, active, applicableCategories[]

Backend:
- offers
- offer_categories (many-to-many)

### User + Address
Frontend type:
- user role: customer | admin
- addresses[]

Backend:
- users
- addresses
- refresh_tokens (if using rotation)

### Cart (required by business flow)
Frontend currently has add-to-cart interactions, no typed cart contract yet.

Backend proposed:
- carts
- cart_items

## 3) Proposed DB Schema (MySQL + Sequelize)

Core tables:
- users (id, email unique, password_hash, first_name, last_name, phone, avatar, role, is_active, created_at, updated_at)
- addresses (id, user_id FK, street, city, state, postal_code, country, is_default)
- categories (id, name, slug unique, description, image, is_active)
- products (id, category_id FK, name, slug unique, description, price, original_price nullable, stock_total, featured, is_new, is_active)
- product_images (id, product_id FK, url, sort_order)
- sizes (id, name unique)
- colors (id, name unique, hex)
- product_variants (id, product_id FK, size_id FK, color_id FK, stock, sku unique nullable)
- offers (id, title, description, discount_percentage, code unique nullable, image, valid_from, valid_until, active)
- offer_categories (offer_id FK, category_id FK, PK composite)
- carts (id, user_id FK nullable, session_id nullable, status: active|ordered|abandoned)
- cart_items (id, cart_id FK, product_id FK, variant_id FK nullable, quantity, unit_price)
- orders (id, user_id FK, cart_id FK, status, subtotal, discount_total, shipping_total, total, payment_status)
- order_items (id, order_id FK, product_id FK, variant_id FK nullable, quantity, unit_price)
- contact_messages (id, name, email, phone, subject, message, status, created_at)

Indexes:
- products: (category_id), (slug), (featured), (is_new), (price)
- offers: (active), (valid_from, valid_until)
- carts: (user_id, status), (session_id, status)
- users: (email unique)

## 4) API Design (v1)

Base path:
- `/api/v1`

Response envelope (aligned with frontend):
- `{ success: boolean, data: T, message?: string }`
- paginated: add `pagination` object

### Public endpoints (storefront)
- GET `/categories`
- GET `/products`
  - query: category, minPrice, maxPrice, sizes, colors, search, sortBy, page, pageSize
- GET `/products/:slug`
- GET `/products/featured`
- GET `/products/new-arrivals`
- GET `/offers` (active + valid)
- GET `/offers/all` (admin/public configurable)
- POST `/contact/messages`

### Auth endpoints
- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/refresh`
- POST `/auth/logout`
- POST `/auth/recover-password`
- POST `/auth/reset-password`
- GET `/auth/me`

### Cart endpoints
- GET `/cart` (by auth user or session token)
- POST `/cart/items`
- PATCH `/cart/items/:itemId`
- DELETE `/cart/items/:itemId`
- DELETE `/cart`

### Admin endpoints (role=admin)
- CRUD `/admin/products`
- CRUD `/admin/categories`
- CRUD `/admin/offers`
- GET `/admin/orders`
- PATCH `/admin/orders/:id/status`
- GET `/admin/contact-messages`
- PATCH `/admin/contact-messages/:id/status`

## 5) UI -> Endpoint Mapping

Home (`web/app/page.tsx`):
- products featured/new-arrivals
- categories list
- active offers

Catalog (`web/app/catalogo/[category]/page.tsx`):
- filtered products with pagination and sorting

Product detail (`web/app/producto/[slug]/page.tsx`):
- product by slug + variant stock

Promotions (`web/app/promociones/page.tsx`):
- all offers + discounted products

Auth pages (`web/app/(auth)/*`):
- register/login/recover password

Contact (`web/app/contacto/page.tsx`):
- submit contact form

Admin products (`web/app/admin/productos/page.tsx`):
- full CRUD products (currently mock)

## 6) Security and Auth Strategy

- JWT access token short TTL + refresh token rotation.
- Password hashing with bcrypt.
- Admin routes guarded by role middleware.
- Rate limit for auth and contact endpoints.
- Input validation with zod schemas per route.
- CORS allowlist from env.

## 7) Execution Plan (phased)

### Phase 0 - Consolidation
- Keep `backend/src` as single source backend.
- Mark `servidor/server.js` as legacy and stop new feature additions there.
- Add `/api/v1` router structure.

### Phase 1 - Domain foundation
- Replace SSD model/migrations with ecommerce migrations.
- Add base models: users, categories, products, offers, images, variants.
- Seed categories (hombre, mujer, ninos).

### Phase 2 - Public API
- Implement categories/products/offers endpoints + filters/pagination.
- Implement contact message creation endpoint.
- Keep response shape matching frontend `ApiResponse` and `PaginatedResponse`.

### Phase 3 - Auth + admin
- Implement auth and role middleware.
- Implement admin CRUD for products/offers/categories.
- Add audit fields (`created_by`, `updated_by`) if needed.

### Phase 4 - Cart + checkout prep
- Add cart and cart items endpoints.
- Resolve stock by variant.
- Add order creation skeleton from cart.

### Phase 5 - Front integration
- Replace `web/lib/services/*.ts` mock logic by HTTP calls to `/api/v1`.
- Keep same function signatures to minimize UI churn.

## 8) Implementation Backlog (ordered)

1. Create Sequelize migrations for ecommerce tables.
2. Add model associations and repository layer.
3. Add request validators and centralized error handler.
4. Build products/categories/offers public controllers.
5. Build auth module (register/login/me/recover/reset).
6. Build admin module for CRUD.
7. Build cart module.
8. Integrate frontend services.
9. Add integration tests for core flows.

## 9) Compatibility Notes with frontend types

- Keep `id` as string in API DTOs even if DB uses numeric IDs (serialize to string), OR migrate DB to UUID. Choose one and keep it consistent.
- Keep `createdAt` and `updatedAt` in ISO string format.
- Keep `category.slug` as exact union values: `hombre`, `mujer`, `ninos`.
- Keep `sortBy` accepted values exactly: `price-asc`, `price-desc`, `newest`, `name`.

## 10) Immediate Next Implementation Slice

Recommended first coding slice:
- migrations + models for categories/products/offers + images + variants
- endpoints:
  - GET `/api/v1/categories`
  - GET `/api/v1/products`
  - GET `/api/v1/products/:slug`
  - GET `/api/v1/offers`
- update frontend services for those read endpoints only

This enables real data in home, catalog, product detail, and promotions with minimal risk.
