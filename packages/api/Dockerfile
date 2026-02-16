# Multi-stage build for Molen API (Bun-based)
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY packages/config ./packages/config
COPY packages/core ./packages/core
COPY packages/api ./packages/api

# Install dependencies
RUN bun install

# Build packages
RUN bun run build:core
RUN bun run build:api

# Production stage
FROM oven/bun:1-alpine

WORKDIR /app

# Copy bundled application and necessary runtime files
COPY --from=builder /app/packages/api/dist/index.js ./index.js
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

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

# Start API server using the bundle
CMD ["bun", "run", "index.js"]
