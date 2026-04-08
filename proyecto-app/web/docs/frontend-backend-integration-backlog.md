# Backlog tecnico de integracion API Backend-Frontend

Fecha: 2026-04-05
Estado: Propuesto para ejecucion
Objetivo: Completar integracion entre API Express (backend) y Next.js (web) con foco en robustez de sesion, contrato estable y cierre de flujos funcionales.

## Convenciones

- Prioridad:
  - P0: Bloqueante para estabilidad o flujo core.
  - P1: Alto impacto funcional.
  - P2: Mejora de calidad y mantenimiento.
- Estimacion:
  - S: 0.5-1 dia
  - M: 1-2 dias
  - L: 2-4 dias
- Definicion de terminado (DoD):
  - Implementado + validado manualmente + contrato consistente + manejo de error.

## Sprint 0 - Estabilizacion de contrato (P0)

### TKT-001 - Resolver ruta duplicada de ofertas all
- Prioridad: P0
- Estimacion: S
- Tipo: Backend
- Estado: Completado
- Archivos:
  - backend/src/routes/v1/catalog.ts
- Problema:
  - Existe mas de un handler para GET /offers/all.
- Tareas:
  - Dejar un solo handler canonical para GET /offers/all.
  - Confirmar comportamiento de includeInactive.
  - Revisar orden por fecha esperado.
- Criterios de aceptacion:
  - GET /api/v1/offers/all responde de forma unica y consistente.
  - No hay rutas duplicadas para el mismo metodo/path.
- Validacion:
  - Verificado con `docker compose run --rm backend npm run test:integration:shop`.

### TKT-002 - Alinear OpenAPI con implementacion real
- Prioridad: P0
- Estimacion: S
- Tipo: Backend/Docs
- Estado: Completado
- Archivos:
  - backend/docs/openapi.json
  - backend/src/routes/v1/*.ts
- Tareas:
  - Validar que metodos, params y cuerpos coincidan con rutas reales.
  - Ajustar respuestas estandar success/data/message.
- Criterios de aceptacion:
  - openapi.json refleja exactamente los endpoints implementados.
  - QA puede testear por contrato sin ambiguedades.
- Validacion:
  - OpenAPI actualizado con respuestas reales para ofertas y auditoria de reset.

## Sprint 1 - Capa de cliente API unificada en frontend (P0)

### TKT-003 - Crear cliente HTTP base reutilizable
- Prioridad: P0
- Estimacion: M
- Tipo: Frontend
- Estado: Completado
- Archivos sugeridos:
  - web/lib/services/http-client.ts (nuevo)
  - web/lib/services/*.ts
- Tareas:
  - Centralizar fetch base URL, headers JSON, parseo de respuesta.
  - Unificar manejo de errores HTTP/red.
  - Reemplazar fetch duplicado en auth/products/offers/cart/addresses.
- Criterios de aceptacion:
  - Servicios usan una sola capa base.
  - Error handling consistente para 4xx/5xx.
- Validacion:
  - Typecheck del frontend ejecutado en Docker con `docker compose run --rm web sh -lc "npm install --no-fund --no-audit && npx tsc --noEmit"`.

### TKT-004 - Implementar estrategia de refresh token en 401
- Prioridad: P0
- Estimacion: M
- Tipo: Frontend/Auth
- Estado: Completado
- Archivos:
  - web/lib/services/auth.ts
  - web/lib/services/http-client.ts (si existe)
- Tareas:
  - Cuando una request autenticada devuelve 401, intentar /auth/refresh una vez.
  - Reintentar request original si refresh es exitoso.
  - Si refresh falla: limpiar sesion y redirigir a /login.
- Criterios de aceptacion:
  - Sesion no se corta abruptamente al expirar access token.
  - No hay loops de refresh infinitos.
- Validacion:
  - Requests autenticadas reintentan una vez con refresh token y limpian sesion + redirigen a /login si falla.

### TKT-005 - Exponer logout real en frontend
- Prioridad: P0
- Estimacion: S
- Tipo: Frontend/Auth
- Estado: Completado
- Archivos:
  - web/lib/services/auth.ts
  - web/app/admin/layout.tsx
  - web/app/mi-cuenta/layout.tsx
- Tareas:
  - Implementar consumo de POST /auth/logout enviando refreshToken.
  - Luego limpiar storage local y redirigir.
- Criterios de aceptacion:
  - Logout invalida sesion en backend y frontend.
- Validacion:
  - `logout()` consume `POST /auth/logout` enviando `refreshToken` y limpia storage local.
  - Typecheck frontend validado en Docker con `docker compose run --rm web sh -lc "npm install --no-fund --no-audit && npx tsc --noEmit"`.

## Sprint 2 - Cierre de flujos de autenticacion y contacto (P1)

### TKT-006 - Crear pantalla de reset password con token
- Prioridad: P1
- Estimacion: M
- Tipo: Frontend/Auth
- Estado: Completado
- Archivos sugeridos:
  - web/app/(auth)/reset-password/page.tsx (nuevo)
  - web/lib/services/auth.ts
- Tareas:
  - Formulario token + password + confirmPassword.
  - Consumir POST /auth/reset-password.
  - Mostrar estados de error/ok.
- Criterios de aceptacion:
  - Flujo recover -> reset completo y usable desde frontend.

### TKT-007 - Integrar contacto real en pagina contacto
- Prioridad: P1
- Estimacion: S
- Tipo: Frontend
- Estado: Completado
- Archivos:
  - web/lib/services/contact.ts (nuevo)
  - web/app/contacto/page.tsx
- Tareas:
  - Remover simulacion de envio.
  - Consumir POST /contact/messages.
  - Mostrar mensajes de exito/error del backend.
- Criterios de aceptacion:
  - Mensajes de contacto se persisten en backend.
- Validacion:
  - Servicio de contacto creado e integrado.
  - Typecheck frontend validado en Docker.
  - Tests de integración backend pasando (should create contact message, should enforce contact rate limit).

## Sprint 3 - Robustez funcional de dominio compra (P1)

### TKT-008 - Fortalecer UX de errores en carrito y pedido
- Prioridad: P1
- Estimacion: M
- Tipo: Frontend
- Estado: Completado
- Archivos:
  - web/lib/services/cart.ts
  - web/app/carrito/page.tsx
  - web/app/producto/[slug]/page.tsx
- Tareas:
  - Manejar explicitamente 401, 404, 409 (stock insuficiente), 500.
  - Mostrar feedback accionable al usuario.
- Criterios de aceptacion:
  - Usuario entiende por que falla cada accion.
- Validacion:
  - Servicio de carrito mejorado con manejo de códigos de error específicos (401, 404, 409, 500).
  - Página de carrito con feedback diferenciado por tipo (error, success, info).
  - Página de producto con mensajes de error específicos al agregar al carrito.
  - Typecheck frontend validado en Docker sin errores.
  - Tests de integración backend pasando (incluyendo 409 para stock insuficiente).

### TKT-009 - Revisar coherencia de tipados Order y Cart
- Prioridad: P1
- Estimacion: S
- Tipo: Frontend/Contrato
- Estado: Completado
- Archivos:
  - web/types/index.ts
  - web/lib/services/cart.ts
- Tareas:
  - Confirmar que todos los campos de respuesta backend esten tipados.
  - Corregir campos opcionales y enum statuses.
- Criterios de aceptacion:
  - Sin casts inseguros en flujo de cart/order.
- Validacion:
  - CartItem actualizado con campo variantId (opcional).
  - OrderItem actualizado con campo variantId (opcional).
  - Order actualizado con campos addressId (opcional) y shippingAddress (opcional).
  - Typecheck frontend validado en Docker sin errores.
  - Tests de integración backend pasando (4/4 tests exitosos).

## Sprint 4 - Hardening backend y observabilidad minima (P1/P2)

### TKT-010 - Normalizar respuestas de error de API
- Prioridad: P1
- Estimacion: M
- Tipo: Backend
- Estado: Completado
- Archivos:
  - backend/src/middleware/api-error.ts (nuevo)
  - backend/src/middleware/error-handler.ts
  - backend/src/middleware/validate.ts
  - backend/src/middleware/auth.ts
  - backend/src/middleware/rate-limit.ts
- Tareas:
  - Estandarizar formato para errores de validacion, auth, negocio e internos.
  - Evitar respuestas heterogeneas por ruta.
- Criterios de aceptacion:
  - Front puede parsear errores de forma uniforme.
- Validacion:
  - Errores estandarizados con envelope `success/data/message/error`.
  - `error.code` y `error.status` disponibles para parseo uniforme en frontend.
  - Tests de integracion backend validados en Docker:
    - `test:integration:auth` (5/5 pass)
    - `test:integration:contact` (2/2 pass)
    - `test:integration:shop` (4/4 pass)

### TKT-011 - Agregar paginacion en listados admin pesados
- Prioridad: P1
- Estimacion: M
- Tipo: Backend/Admin
- Estado: Completado
- Archivos:
  - backend/src/routes/v1/admin.ts
  - backend/src/admin.integration.test.ts
- Tareas:
  - page/pageSize en orders y contact-messages.
  - Responder pagination en envelope.
- Criterios de aceptacion:
  - Listados admin no cargan todo de una vez.
- Validacion:
  - `GET /api/v1/admin/contact-messages?page=1&pageSize=5` responde `data` paginada + `pagination`.
  - `GET /api/v1/admin/orders?page=1&pageSize=5` responde `data` paginada + `pagination`.
  - Tests de integración en Docker:
    - `test:integration:admin` (9/9 pass)
    - `test:integration:shop` (4/4 pass)

### TKT-012 - Logging tecnico minimo en puntos criticos
- Prioridad: P2
- Estimacion: S
- Tipo: Backend/Frontend
- Estado: Completado
- Archivos:
  - backend/src/utils/logger.ts (nuevo)
  - backend/src/routes/v1/auth.ts
  - backend/src/routes/v1/shop.ts
  - web/lib/services/http-client.ts
- Tareas:
  - Backend: logs en errores de auth/refresh/order.
  - Frontend: trazas de fallo de request (sin exponer datos sensibles).
- Criterios de aceptacion:
  - Debug de incidentes posible sin inspeccion manual extensa.
- Validacion:
  - Backend con logs tecnicos en errores de `recover-password`, `refresh`, `reset-password` y `create-order`.
  - Frontend con trazas tecnicas en `requestJson`, `refreshAuthSession` y reintentos 401.
  - Validado en Docker:
    - `web npx tsc --noEmit` (ok)
    - `backend test:integration:auth` (5/5 pass)
    - `backend test:integration:shop` (4/4 pass)
    - `backend test:integration:admin` (9/9 pass)

## Sprint 5 - QA integrado y salida a staging (P0)

### TKT-013 - Suite de pruebas de integracion por flujo usuario
- Prioridad: P0
- Estimacion: L
- Tipo: QA/Backend
- Archivos:
  - backend/src/*.integration.test.ts
- Tareas:
  - Cobertura de flujo: register/login -> catalogo -> cart -> order -> orders list.
  - Cobertura de auth refresh/logout/recover/reset.
- Criterios de aceptacion:
  - Flujos core verdes en CI local.

### TKT-014 - Smoke test frontend con backend real
- Prioridad: P0
- Estimacion: M
- Tipo: QA/Frontend
- Tareas:
  - Validar pantallas principales con NEXT_PUBLIC_API_URL configurada.
  - Confirmar guards de admin/customer y redirecciones.
- Criterios de aceptacion:
  - Flujo de compra y admin funcional end-to-end.

## Dependencias clave

- TKT-001 antes de TKT-002 y antes de pruebas finales de ofertas.
- TKT-003 antes de TKT-004.
- TKT-004 y TKT-005 antes de cerrar auth hardening.
- TKT-006 depende de endpoints recover/reset ya estables.
- TKT-013 y TKT-014 dependen de cierre funcional de Sprints 1-4.

## Orden recomendado de ejecucion

1. TKT-001
2. TKT-002
3. TKT-003
4. TKT-004
5. TKT-005
6. TKT-007
7. TKT-006
8. TKT-008
9. TKT-009
10. TKT-010
11. TKT-011
12. TKT-012
13. TKT-013
14. TKT-014

## Checklist operativo para arrancar ya

- [ ] Definir responsable por ticket (Backend, Frontend, QA)
- [ ] Definir rama por sprint o por ticket
- [ ] Configurar entorno local con NEXT_PUBLIC_API_URL y BACKEND_PORT
- [ ] Correr smoke manual despues de cada sprint
- [ ] Actualizar estado del backlog semanalmente
