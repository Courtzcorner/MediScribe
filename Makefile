# ─────────────────────────────────────────────────────────────────────────────
# MediScribe — Developer Commands
# Usage: make <target>
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help install install-frontend install-backend venv dev dev-frontend dev-backend \
        build test test-backend test-frontend lint lint-backend lint-frontend \
        docker-up docker-down docker-build docker-logs migrate clean

# Colours
GREEN  := \033[0;32m
YELLOW := \033[1;33m
RESET  := \033[0m

# Virtual environment (avoids PEP 668 externally-managed-environment on macOS)
VENV   := .venv
PY     := $(VENV)/bin/python
PIP    := $(VENV)/bin/pip

help: ## Show this help message
	@echo ""
	@echo "$(GREEN)MediScribe — Available Commands$(RESET)"
	@echo "────────────────────────────────────────"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-22s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ── Installation ──────────────────────────────────────────────────────────────

install: install-backend install-frontend ## Install all dependencies

install-backend: venv ## Install Python dependencies
	@echo "$(GREEN)Installing Python dependencies...$(RESET)"
	$(PIP) install -r requirements.txt

venv: ## Create Python virtual environment if it doesn't exist
	@test -d $(VENV) || (echo "$(GREEN)Creating virtual environment...$(RESET)" && python3 -m venv $(VENV))

install-frontend: ## Install Node.js dependencies
	@echo "$(GREEN)Installing Node.js dependencies...$(RESET)"
	cd frontend && npm install

# ── Development ───────────────────────────────────────────────────────────────

dev: ## Start both frontend and backend in development mode
	@echo "$(GREEN)Starting MediScribe in development mode...$(RESET)"
	@make -j2 dev-backend dev-frontend

dev-backend: venv ## Start FastAPI backend (hot reload)
	@echo "$(GREEN)Starting backend on http://localhost:8000$(RESET)"
	$(VENV)/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level info

dev-frontend: ## Start Next.js frontend (hot reload)
	@echo "$(GREEN)Starting frontend on http://localhost:3000$(RESET)"
	cd frontend && npm run dev

dev-worker: venv ## Start Celery worker for background jobs
	@echo "$(GREEN)Starting Celery worker...$(RESET)"
	$(VENV)/bin/celery -A backend.pipeline.job_manager.celery_app worker \
		--loglevel=info --queues=pipeline,analysis --concurrency=2

# ── Build ─────────────────────────────────────────────────────────────────────

build: ## Build frontend for production
	@echo "$(GREEN)Building frontend...$(RESET)"
	cd frontend && npm run build

# ── Testing ───────────────────────────────────────────────────────────────────

test: test-backend test-frontend ## Run all tests

test-backend: venv ## Run Python tests with coverage
	@echo "$(GREEN)Running backend tests...$(RESET)"
	$(VENV)/bin/pytest tests/ -v --cov=backend --cov=api \
		--cov-report=term-missing --cov-report=html:coverage/backend

test-frontend: ## Run Next.js type check and lint
	@echo "$(GREEN)Running frontend checks...$(RESET)"
	cd frontend && npm run type-check && npm run lint

test-unit: venv ## Run only unit tests
	$(VENV)/bin/pytest tests/unit/ -v

test-integration: venv ## Run only integration tests
	$(VENV)/bin/pytest tests/integration/ -v

# ── Linting ───────────────────────────────────────────────────────────────────

lint: lint-backend lint-frontend ## Lint all code

lint-backend: venv ## Lint Python code (ruff + mypy)
	@echo "$(GREEN)Linting backend...$(RESET)"
	$(VENV)/bin/ruff check backend/ api/ config/ main.py
	$(VENV)/bin/mypy backend/ api/ --ignore-missing-imports

lint-frontend: ## Lint TypeScript code
	@echo "$(GREEN)Linting frontend...$(RESET)"
	cd frontend && npm run lint

format: venv ## Auto-format Python code
	$(VENV)/bin/ruff format backend/ api/ config/ main.py
	$(VENV)/bin/ruff check --fix backend/ api/ config/ main.py

# ── Docker ────────────────────────────────────────────────────────────────────

docker-up: ## Start all services with Docker Compose
	@echo "$(GREEN)Starting Docker services...$(RESET)"
	docker compose up -d

docker-down: ## Stop all Docker services
	@echo "$(GREEN)Stopping Docker services...$(RESET)"
	docker compose down

docker-build: ## Build Docker images
	@echo "$(GREEN)Building Docker images...$(RESET)"
	docker compose build

docker-logs: ## Tail logs from all containers
	docker compose logs -f

docker-reset: ## Tear down and remove volumes (DESTRUCTIVE)
	@echo "$(YELLOW)Warning: This will delete all Docker volumes!$(RESET)"
	docker compose down -v

# ── Database ──────────────────────────────────────────────────────────────────

migrate: venv ## Run Alembic database migrations
	@echo "$(GREEN)Running database migrations...$(RESET)"
	$(VENV)/bin/alembic upgrade head

migrate-create: venv ## Create a new migration (usage: make migrate-create MSG="add users table")
	$(VENV)/bin/alembic revision --autogenerate -m "$(MSG)"

migrate-rollback: venv ## Rollback one migration
	$(VENV)/bin/alembic downgrade -1

# ── Utilities ─────────────────────────────────────────────────────────────────

env: ## Copy .env.example to .env (if .env doesn't exist)
	@test -f .env || (cp .env.example .env && echo "$(GREEN).env created from .env.example$(RESET)")

clean: ## Remove build artifacts and caches
	@echo "$(GREEN)Cleaning build artifacts...$(RESET)"
	find . -type d -name __pycache__ | xargs rm -rf
	find . -type d -name .pytest_cache | xargs rm -rf
	find . -type d -name .mypy_cache | xargs rm -rf
	find . -type d -name .ruff_cache | xargs rm -rf
	rm -rf coverage/ .coverage
	cd frontend && rm -rf .next out node_modules/.cache

setup: env install migrate ## First-time project setup (env + install + migrate)
	@echo ""
	@echo "$(GREEN)✓ MediScribe is ready!$(RESET)"
	@echo "  Run $(YELLOW)make dev$(RESET) to start the development servers."
