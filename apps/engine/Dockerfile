# Build stage
FROM rust:1.85-slim AS builder

RUN apt-get update && apt-get install -y \
    cmake \
    pkg-config \
    libssl-dev \
    zlib1g-dev \
    gcc \
    g++ \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY apps/engine/Cargo.toml ./apps/engine/
COPY Cargo.toml Cargo.lock ./
# Create a dummy src/main.rs for the engine
RUN mkdir -p apps/engine/src && echo "fn main() {}" > apps/engine/src/main.rs
RUN cargo build --release -p molen-engine
RUN rm -rf apps/engine/src

COPY apps/engine/src ./apps/engine/src
RUN touch apps/engine/src/main.rs
RUN cargo build --release -p molen-engine

# Run stage
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/molen-engine /app/molen-engine
CMD ["./molen-engine"]
