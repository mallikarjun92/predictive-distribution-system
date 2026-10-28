FROM node:22-alpine AS builder

WORKDIR /app

# Copy root configurations
COPY package.json tsconfig.base.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

RUN npm install

COPY packages/core ./packages/core
COPY packages/db ./packages/db
COPY apps/api ./apps/api

RUN npm run --workspace=packages/core build
RUN npm run --workspace=packages/db build
RUN npm run --workspace=apps/api build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/package.json
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api
EXPOSE 4000

CMD ["node", "dist/index.js"]
