# Multi-stage build for Molen UI (React/Vite)
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy workspace files
COPY package.json bun.lockb* ./
COPY packages/config ./packages/config
COPY packages/ui ./packages/ui

# Install dependencies
RUN bun install --frozen-lockfile

# Build UI
WORKDIR /app/packages/ui
RUN bun run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/packages/ui/dist /usr/share/nginx/html

# Copy custom nginx config
COPY packages/ui/nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S molen && \
    adduser -S molen -u 1001 && \
    chown -R molen:molen /usr/share/nginx/html && \
    chown -R molen:molen /var/cache/nginx && \
    chown -R molen:molen /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R molen:molen /var/run/nginx.pid

USER molen

# Expose UI port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
