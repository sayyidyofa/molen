# Build stage
FROM oven/bun:1.3.4 AS builder
WORKDIR /app

# Only copy what's needed for install
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN bun install

# Now copy everything else
COPY . .
# Ensure symlinks are correct
RUN bun install

# Runtime stage
FROM oven/bun:1.3.4-slim
WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3000
ENV NODE_ENV=production
CMD ["sh", "-c", "bun apps/api/src/db-init.ts && bun apps/api/src/index.ts"]
