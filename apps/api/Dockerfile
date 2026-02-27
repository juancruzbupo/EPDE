FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# --- Install dependencies ---
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod=false

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
RUN pnpm --filter @epde/shared build
RUN cd apps/api && npx prisma generate && pnpm build

# --- Production ---
FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S epde && adduser -S epde -u 1001

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/packages/shared/dist ../packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ../packages/shared/

USER epde
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/main"]
