# API Docs y clientes (Swagger, Postman, Insomnia)

## 1) Swagger UI interactivo

1. Levanta el backend.
2. Abre en navegador: `http://localhost:5000/api/docs`
3. Si quieres ver el contrato raw: `http://localhost:5000/api/openapi.json`

En Swagger UI puedes:
- Explorar endpoints por tags.
- Ejecutar requests con `Try it out`.
- Mantener token JWT entre requests (`persistAuthorization`).

## 2) Postman

Archivos incluidos:
- `docs/postman-collection.json`
- `docs/postman-environment-local.json`

Pasos:
1. Importa primero `docs/postman-collection.json`.
2. Importa despues `docs/postman-environment-local.json`.
3. Activa el environment `ModaCom Local`.
4. Ejecuta `POST /api/v1/auth/login` para autocompletar `accessToken` y `refreshToken` en el environment activo y en la coleccion.
5. Prueba endpoints autenticados (addresses, cart, orders, admin).

## 3) Insomnia

Opcion recomendada:
1. En Insomnia, usa `Import`.
2. Selecciona `docs/openapi.json`.
3. Insomnia generara requests por cada endpoint del contrato.

Opcion alternativa:
1. Importar `docs/postman-collection.json`.
2. Ajustar la variable `baseUrl` a `http://localhost:5000` si no importas el environment.

## 4) Notas rapidas

- Los endpoints con `bearerAuth` requieren header: `Authorization: Bearer <accessToken>`.
- El recover/reset de password tiene rate limit por IP.
- Para auditoria de reset usar: `GET /api/v1/admin/security/password-reset-events`.
