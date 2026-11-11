#!/usr/bin/env bash
# Starts everything the demo server needs inside one container.
# Redis and Postgres keep data in memory/temp storage only: each restart is a fresh
# demo world, and the backend re-creates the demo account and villagers on startup.
set -euo pipefail

PGBIN=$(ls -d /usr/lib/postgresql/*/bin | head -n 1)
PGDATA=/tmp/pgdata
export POSTGRES_USER="${POSTGRES_USER:-questforge}"
export POSTGRES_DB="${POSTGRES_DB:-questforge}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')}"
# The demo account is entered with the "Try the demo" button, so its password never needs to be known
export DEMO_EMAIL="${DEMO_EMAIL:-demo@questforge.app}"
export DEMO_PASSWORD="${DEMO_PASSWORD:-$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')}"

echo "Starting Redis"
redis-server --bind 127.0.0.1 --save "" --appendonly no --daemonize yes

echo "Starting Postgres"
mkdir -p "$PGDATA"
chown postgres:postgres "$PGDATA"
runuser -u postgres -- "$PGBIN/initdb" -D "$PGDATA" -U postgres --auth=trust >/dev/null
runuser -u postgres -- "$PGBIN/pg_ctl" -D "$PGDATA" -l /tmp/postgres.log -w start \
  -o "-c listen_addresses=127.0.0.1 -c unix_socket_directories=/tmp -c shared_buffers=32MB -c max_connections=30"
runuser -u postgres -- psql -h 127.0.0.1 -U postgres -v ON_ERROR_STOP=1 -q \
  -c "CREATE USER \"$POSTGRES_USER\" WITH PASSWORD '$POSTGRES_PASSWORD';" \
  -c "CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\";"

echo "Starting the game engine"
game-engine &

echo "Starting the API on port $PORT"
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
