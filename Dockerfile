FROM node:20-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS dev

ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

FROM base AS build

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["npm", "run", "start"]