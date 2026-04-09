# MODACOM

Base inicial para reiniciar el proyecto con arquitectura separada:

- Frontend: Next.js + TypeScript
- Backend: Express + TypeScript + Sequelize
- Base de datos: MySQL 8
- Orquestación: Docker Compose

## Rama de trabajo

`chore/nextjs-typescript-base`

## Estructura base

- `proyecto-app/web`: UI en Next.js
- `proyecto-app/backend`: API REST en Express + Sequelize
- `docker-compose.yml`: servicios `web`, `backend` y `mysql`

## Variables de entorno

Archivo recomendado para desarrollo local (raíz):

- `.env`

Contenido base:

```env
NODE_ENV=development
MYSQL_ADDON_HOST=mysql
MYSQL_ADDON_DB=modacom
MYSQL_ADDON_USER=user
MYSQL_ADDON_PASSWORD=password
MYSQL_ADDON_PORT=3306
MYSQL_ADDON_URI=mysql://user:password@mysql:3306/modacom
BACKEND_PORT=5000
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
INTERNAL_API_URL=http://backend:5000
PASSWORD_RESET_TOKEN_EXPIRES_IN=1h
FRONTEND_RESET_PASSWORD_URL=http://localhost:3000/recuperar-password
# También aceptado: EMAIL_API_KEY
RESEND_API_KEY=re_xxxxxxxxx
# También aceptado: EMAIL_DOMAIN
RESEND_EMAIL_DOMAIN=tudominio.com
# Optional: override sender address/display name
# RESEND_FROM_EMAIL=ModaCom <noreply@tudominio.com>
```

Nota Docker: `NEXT_PUBLIC_API_URL` lo usa el navegador, mientras `INTERNAL_API_URL` lo usa Next.js en renderizado del servidor dentro del contenedor `web`.

## Levantar con Docker Compose

```bash
docker compose up -d --build
```

Servicios:

- Web: http://localhost:3000
- Backend API: http://localhost:5000/api
- MySQL: localhost:3306

## Comandos base ORM (Sequelize)

Desde `proyecto-app/backend`:

```bash
npm run db:migrate
npm run db:migrate:undo
npm run db:seed
```
