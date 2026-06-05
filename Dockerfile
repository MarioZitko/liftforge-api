# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies (including devDeps needed for build)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Merge split prisma schemas and generate client
RUN npm run prisma:generate

# Compile NestJS → dist/
RUN npm run build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install all deps with --ignore-scripts so the postinstall (prisma:generate)
# is skipped — we copy the pre-built client from the builder stage instead.
# We need all deps (including devDeps) because prisma CLI is in devDependencies
# and is required by the entrypoint to run `prisma migrate deploy`.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy compiled application
COPY --from=builder /app/dist ./dist

# Copy pre-built Prisma client (built on same Alpine base — binary compatible)
COPY --from=builder /app/generated ./generated

# Copy Prisma schema files (needed by `prisma migrate deploy` at runtime)
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]