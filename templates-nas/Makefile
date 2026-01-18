# ============================================
# {{PROJECT_NAME}} - Makefile
# ============================================

.PHONY: help dev prod deploy

COMPOSE_DEV = docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev
COMPOSE_PROD = docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod

GREEN  := $(shell tput setaf 2)
YELLOW := $(shell tput setaf 3)
RESET  := $(shell tput sgr0)

help:
	@echo "$(GREEN)Comandos:$(RESET)"
	@echo "  $(YELLOW)make dev$(RESET)        - Desarrollo (NAS)"
	@echo "  $(YELLOW)make dev-build$(RESET)  - Rebuild desarrollo"
	@echo "  $(YELLOW)make dev-logs$(RESET)   - Logs desarrollo"
	@echo "  $(YELLOW)make dev-down$(RESET)   - Detener desarrollo"
	@echo "  $(YELLOW)make prod$(RESET)       - Producción (VPS)"
	@echo "  $(YELLOW)make prod-build$(RESET) - Rebuild producción"
	@echo "  $(YELLOW)make deploy$(RESET)     - Deploy NAS → VPS"
	@echo "  $(YELLOW)make db-shell$(RESET)   - Shell PostgreSQL"
	@echo "  $(YELLOW)make backup$(RESET)     - Backup DB"

# Desarrollo
dev:
	$(COMPOSE_DEV) up -d
	@echo "$(GREEN)Frontend: http://localhost:3000$(RESET)"
	@echo "$(GREEN)Backend:  http://localhost:3001$(RESET)"

dev-build:
	$(COMPOSE_DEV) up -d --build

dev-logs:
	$(COMPOSE_DEV) logs -f

dev-down:
	$(COMPOSE_DEV) down

# Producción
prod:
	$(COMPOSE_PROD) up -d

prod-build:
	$(COMPOSE_PROD) up -d --build

prod-logs:
	$(COMPOSE_PROD) logs -f

prod-down:
	$(COMPOSE_PROD) down

# Deploy
deploy:
	@./scripts/deploy.sh

# Utils
db-shell:
	$(COMPOSE_DEV) exec postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

backup:
	@mkdir -p backups
	$(COMPOSE_DEV) exec -T postgres pg_dump -U $${POSTGRES_USER} $${POSTGRES_DB} > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup creado$(RESET)"
