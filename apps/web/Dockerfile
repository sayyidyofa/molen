FROM oven/bun:1.3.4 AS builder
WORKDIR /app
COPY . .
RUN bun install
WORKDIR /app/apps/web
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN bun run build

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
