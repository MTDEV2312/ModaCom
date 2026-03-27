FROM node:20-alpine AS frontend-builder

WORKDIR /app/client
COPY proyecto-app/client/package*.json ./
RUN npm ci
COPY proyecto-app/client/ ./
RUN npm run build

FROM node:20-alpine AS backend-deps

WORKDIR /app/servidor
COPY proyecto-app/servidor/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime

WORKDIR /app/servidor
ENV NODE_ENV=production
ENV PORT=5000

COPY --from=backend-deps /app/servidor/node_modules ./node_modules
COPY proyecto-app/servidor/ ./
COPY --from=frontend-builder /app/client/build ./public

EXPOSE 5000
CMD ["node", "server.js"]