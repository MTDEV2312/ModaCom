# ModaCom Backend API Reference

## Scope and Status

- Version: v1
- Base path: `/api/v1`
- Health path: `/api/health`
- Status: functional and validated with Docker integration tests.

## Interactive Documentation and API Clients

- OpenAPI JSON: `GET /api/openapi.json`
- Swagger UI (interactive): `GET /api/docs`
- Postman assets:
  - `backend/docs/postman-collection.json`
  - `backend/docs/postman-environment-local.json`
- Insomnia import:
  - Import directly from `backend/docs/openapi.json`
  - Or import Postman collection as alternative

Usage guide:
- `backend/docs/api-clients-guide.md`

## Conventions

### Auth

- Protected endpoints require header:
  - `Authorization: Bearer <access_token>`
- Access token errors:
  - `401` + `Token requerido`
  - `401` + `Token inválido o expirado`
- Admin-only endpoints also require role `admin`:
  - `403` + `Acceso solo para administradores`

### Response Envelope

Most endpoints return:

```json
{
  "success": true,
  "data": {},
  "message": "optional"
}
```

Paginated endpoints also include:

```json
{
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

### Rate Limits

Applied in memory by client IP (`x-forwarded-for` first value, fallback socket IP):

- `/api/v1/auth` (general auth): 50 req / 15 min
- `/api/v1/auth/recover-password`: 5 req / 15 min
- `/api/v1/auth/reset-password`: 10 req / 15 min
- `/api/v1/contact/messages`: 20 req / 15 min

Limit response:

```json
{
  "success": false,
  "data": null,
  "message": "<rate-limit-message>"
}
```

---

## Health

### GET /api/health

Checks service and DB connectivity.

- Auth: public
- Success `200`:

```json
{
  "status": "ok",
  "service": "backend",
  "database": "connected"
}
```

- Error `500`:

```json
{
  "status": "error",
  "service": "backend",
  "database": "disconnected"
}
```

---

## Auth

### POST /api/v1/auth/register

Creates a customer account.

Body:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "firstName": "Nombre",
  "lastName": "Apellido",
  "acceptTerms": true
}
```

Validation:
- `email` valid
- `password` min 8
- `confirmPassword` must match
- `acceptTerms` must be true

### POST /api/v1/auth/login

Returns access token + refresh token + user payload.

Body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### GET /api/v1/auth/me

Returns authenticated user profile and addresses.

- Auth: required

### POST /api/v1/auth/recover-password

Creates one-time reset token and attempts email delivery.

Body:

```json
{
  "email": "user@example.com"
}
```

Behavior:
- Always generic response to avoid user enumeration.
- In non-production, may include debug token in `data.resetToken`.
- Persists audit metadata (`requestedIp`, `requestedUserAgent`, provider trace id when available).

### POST /api/v1/auth/refresh

Rotates refresh token and returns new token pair.

Body:

```json
{
  "refreshToken": "<jwt>"
}
```

### POST /api/v1/auth/logout

Revokes provided refresh token.

Body:

```json
{
  "refreshToken": "<jwt>"
}
```

### POST /api/v1/auth/reset-password

Consumes one-time reset token, updates password, and revokes active refresh sessions.

Body:

```json
{
  "token": "<raw-reset-token>",
  "password": "new-password-123",
  "confirmPassword": "new-password-123"
}
```

Validation:
- `token` required
- `password` min 8
- `confirmPassword` must match

---

## Addresses

All endpoints in this section require auth.

### GET /api/v1/addresses

Lists user addresses ordered by default first, then newest.

### POST /api/v1/addresses

Creates an address. If it is first address, it becomes default automatically.

Body:

```json
{
  "street": "Calle 123",
  "city": "Madrid",
  "state": "Madrid",
  "postalCode": "28001",
  "country": "Espana",
  "isDefault": true
}
```

### PATCH /api/v1/addresses/:id

Updates address fields.

Body (all optional):

```json
{
  "street": "Nueva calle",
  "city": "Madrid",
  "state": "Madrid",
  "postalCode": "28002",
  "country": "Espana",
  "isDefault": false
}
```

### PATCH /api/v1/addresses/:id/default

Marks given address as default.

### DELETE /api/v1/addresses/:id

Deletes address. If deleted one was default, backend assigns a new default when possible.

---

## Catalog (Public)

### GET /api/v1/categories

Returns active categories.

### GET /api/v1/products

Paginated product listing with filters.

Query params:
- `category`
- `minPrice`
- `maxPrice`
- `sizes` (comma separated)
- `colors` (comma separated)
- `search`
- `sortBy`: `price-asc | price-desc | newest | name`
- `page`
- `pageSize` (max 100)

### GET /api/v1/products/featured

Returns up to 8 featured active products.

### GET /api/v1/products/new-arrivals

Returns up to 8 active products marked as new.

### GET /api/v1/products/:slug

Returns product detail by slug.

### GET /api/v1/offers

Returns active offers in valid date range.

### GET /api/v1/offers/all

Returns all active offers by default.

Query params:
- `includeInactive=true|false` (optional)

---

## Contact

### POST /api/v1/contact/messages

Creates contact message entry.

Body:

```json
{
  "name": "Nombre",
  "email": "user@example.com",
  "phone": "+34...",
  "subject": "Consulta",
  "message": "Texto"
}
```

Validation:
- `name`, `subject`, `message` required
- `email` valid
- `phone` optional

---

## Shop (Customer)

All endpoints in this section require auth.

### GET /api/v1/cart

Returns active cart with summary (`subtotal`, `shippingTotal`, `total`).

### POST /api/v1/cart/items

Adds item by variant selectors.

Body:

```json
{
  "productId": 1,
  "quantity": 2,
  "sizeName": "M",
  "colorName": "Negro"
}
```

Notes:
- Enforces variant existence.
- Enforces stock limit.

### PATCH /api/v1/cart/items/:itemId

Updates item quantity.

Body:

```json
{
  "quantity": 3
}
```

### DELETE /api/v1/cart/items/:itemId

Removes one cart item.

### DELETE /api/v1/cart

Clears cart.

### POST /api/v1/orders

Creates order from active cart and shipping address.

Body:

```json
{
  "addressId": 10
}
```

Behavior:
- Validates ownership of address.
- Locks and validates stock.
- Creates order + order items.
- Decrements variant/product stock.
- Marks current cart as `ordered` and creates new active cart.

### GET /api/v1/orders

Lists user orders.

---

## Admin (Admin role)

All endpoints in this section require auth + admin role.

### Categories

- `GET /api/v1/admin/categories`
- `POST /api/v1/admin/categories`
- `PATCH /api/v1/admin/categories/:id`
- `DELETE /api/v1/admin/categories/:id`

Business rules:
- Slug allowed values: `hombre | mujer | ninos`
- Prevent duplicate slug
- Prevent delete when category has products

### Offers

- `GET /api/v1/admin/offers`
- `POST /api/v1/admin/offers`
- `PATCH /api/v1/admin/offers/:id`
- `DELETE /api/v1/admin/offers/:id`

Validation highlights:
- Required on create: `title`, `description`, `discountPercentage`, `image`, `validFrom`, `validUntil`
- Discount range: `0..100`
- Valid date range
- Applicable categories must exist and be active

### Products

- `POST /api/v1/admin/products`
- `PATCH /api/v1/admin/products/:id`
- `DELETE /api/v1/admin/products/:id`

Validation highlights:
- Required on create: `name`, `price`, `categorySlug`
- Category slug must map to active category
- Supports explicit `variants` payload
- If variants omitted, backend creates default size/color variants
- Product stock is recalculated from variant stock

### Contact Messages

- `GET /api/v1/admin/contact-messages`
- `PATCH /api/v1/admin/contact-messages/:id/status`

Status values:
- `new | in_progress | resolved`

### Orders

- `GET /api/v1/admin/orders`
- `PATCH /api/v1/admin/orders/:id/status`

Status values:
- `pending | confirmed | cancelled`

### Security Audit

- `GET /api/v1/admin/security/password-reset-events`

Query params:
- `page` (default 1)
- `pageSize` (default 20, max 100)
- `email` (optional exact match filter)

Returns:
- reset event status (`active | used | expired`)
- request/usage metadata (`requestedIp`, `requestedUserAgent`, `usedIp`, `usedUserAgent`)
- provider traceability (`providerMessageId` when available)

---

## Integration Validation

The API behaviors in this reference are validated by Docker integration tests across:

- auth lifecycle and reset hardening
- admin authz + CRUD + audit endpoints
- shop cart and order flows
- contact creation and rate limiting
