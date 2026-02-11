# Multi-stage build for Molen API (Bun-based)
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy workspace files
COPY package.json bun.lockb* ./
COPY packages/config ./packages/config
COPY packages/core ./packages/core
COPY packages/api ./packages/api

# Install dependencies
RUN bun install --frozen-lockfile

# Build packages
WORKDIR /app/packages/core
RUN bun run typecheck || true

WORKDIR /app/packages/api
RUN bun run typecheck || true

# Production stage
FROM oven/bun:1-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN addgroup -g 1001 -S molen && \
    adduser -S molen -u 1001 && \
    chown -R molen:molen /app

USER molen

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run -e 'fetch("http://localhost:3000/health").then(r => r.ok ? process.exit(0) : process.exit(1))' || exit 1

# Start API server
WORKDIR /app/packages/api
CMD ["bun", "run", "src/index.ts"]
