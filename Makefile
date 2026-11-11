.PHONY: dev dev-backend dev-frontend dev-game build-backend build-frontend build-game db-up db-down

dev:
	docker compose up --build

dev-backend:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

dev-game:
	cd game-engine && cargo watch -x run

build-backend:
	docker compose build backend

build-frontend:
	docker compose build frontend

build-game:
	docker compose build game-engine

build-wasm:
	cd game-wasm && wasm-pack build --target web

db-up:
	docker compose up postgres redis -d

db-down:
	docker compose down

test-backend:
	cd backend && pytest

test-game:
	cd game-engine && cargo test

test-frontend:
	cd frontend && npm test

lint-backend:
	cd backend && ruff check .

lint-frontend:
	cd frontend && npm run lint

fmt-game:
	cd game-engine && cargo fmt

migrate:
	cd backend && alembic upgrade head

migrate-new:
	cd backend && alembic revision --autogenerate -m "$(name)"
