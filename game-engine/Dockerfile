FROM rust:1.88-slim-bookworm AS builder

WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release 2>/dev/null || true

COPY src/ src/
# Touch main.rs so cargo rebuilds the real code instead of reusing the cached placeholder build
RUN touch src/main.rs && cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/game-engine /app/game-engine
EXPOSE 8001
CMD ["/app/game-engine"]
