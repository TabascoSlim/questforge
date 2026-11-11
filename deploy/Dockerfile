# Free live demo image: the FastAPI backend, Rust game engine, Redis and Postgres
# in one container, so the whole server fits on a single free web service.
# Build from the repo root:  docker build -f deploy/Dockerfile -t questforge-demo .

FROM rust:1.88-slim-bookworm AS engine
WORKDIR /app
COPY game-engine/Cargo.toml game-engine/Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && (cargo build --release 2>/dev/null || true)
COPY game-engine/src/ src/
RUN touch src/main.rs && cargo build --release

FROM python:3.12-slim-bookworm
RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql redis-server \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY --from=engine /app/target/release/game-engine /usr/local/bin/game-engine
COPY deploy/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

ENV POSTGRES_HOST=127.0.0.1 \
    REDIS_HOST=127.0.0.1 \
    GAME_ENGINE_PORT=8001 \
    GAME_ENGINE_URL=http://127.0.0.1:8001 \
    DEMO_USER_ENABLED=true \
    PORT=10000
EXPOSE 10000
CMD ["start.sh"]
