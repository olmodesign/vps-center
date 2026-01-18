# ============================================
# {{PROJECT_NAME}} - Makefile
# ============================================

.PHONY: help build up down restart logs shell db-shell backup

COMPOSE = docker compose
GREEN  := $(shell tput setaf 2)
YELLOW := $(shell tput setaf 3)
RESET  := $(shell tput sgr0)

help:
	@echo "$(GREEN)Comandos disponibles:$(RESET)"
	@echo "  $(YELLOW)build$(RESET)      - Construir imágenes"
	@echo "  $(YELLOW)up$(RESET)         - Iniciar servicios"
	@echo "  $(YELLOW)down$(RESET)       - Detener servicios"
	@echo "  $(YELLOW)restart$(RESET)    - Reiniciar servicios"
	@echo "  $(YELLOW)logs$(RESET)       - Ver logs"
	@echo "  $(YELLOW)shell$(RESET)      - Shell en backend"
	@echo "  $(YELLOW)db-shell$(RESET)   - Shell PostgreSQL"
	@echo "  $(YELLOW)backup$(RESET)     - Crear backup DB"

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

logs:
	$(COMPOSE) logs -f

shell:
	$(COMPOSE) exec backend sh

db-shell:
	$(COMPOSE) exec postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}

backup:
	@mkdir -p backups
	$(COMPOSE) exec postgres pg_dump -U $${POSTGRES_USER} $${POSTGRES_DB} > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup creado$(RESET)"

status:
	$(COMPOSE) ps

deploy:
	git pull origin main
	$(COMPOSE) up -d --build
	@echo "$(GREEN)Desplegado$(RESET)"
