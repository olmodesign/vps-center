#!/bin/bash
# ============================================
# VPS Center - Setup NAS Dev Templates
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   VPS Center - NAS Dev Templates       ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

BASE_DIR="/opt/vps-center"
cd "$BASE_DIR"

# Crear estructura
echo -e "${YELLOW}Creando estructura para desarrollo NAS...${NC}"
mkdir -p templates-nas/frontend
mkdir -p templates-nas/backend
mkdir -p templates-nas/database
mkdir -p templates-nas/scripts

# ============================================
# NAS_DEV_TEMPLATE.md
# ============================================

cat > docs/NAS_DEV_TEMPLATE.md << 'EOF'
# VPS Center - Plantilla de Desarrollo (NAS)

Plantilla para desarrollar proyectos en el servidor NAS con estructura compatible para deploy directo al VPS.

## Flujo NAS → VPS

```
NAS (Desarrollo)                    VPS (Producción)
────────────────                    ────────────────
docker-compose.yml                  docker-compose.yml
docker-compose.dev.yml   ──push──>  docker-compose.prod.yml
.env.dev                            .env.prod

http://nas-ip:3000                  https://app.olmodesign.es
Sin Traefik, hot reload             Traefik + SSL
```

## Comandos

```bash
# Desarrollo (NAS)
make dev              # Iniciar
make dev-logs         # Ver logs
make dev-down         # Detener

# Producción (VPS)
make prod             # Iniciar
make deploy           # Deploy desde NAS a VPS
```

## Estructura

```
proyecto/
├── docker-compose.yml        # Base común
├── docker-compose.dev.yml    # NAS (puertos expuestos)
├── docker-compose.prod.yml   # VPS (Traefik)
├── .env.dev                  # Variables desarrollo
├── .env.prod                 # Variables producción
├── frontend/
│   ├── Dockerfile            # Producción
│   └── Dockerfile.dev        # Desarrollo (hot reload)
├── backend/
│   ├── Dockerfile
│   └── Dockerfile.dev
└── scripts/
    └── deploy.sh
```

VPS Center v1.0
EOF

echo "  ✓ docs/NAS_DEV_TEMPLATE.md"

# ============================================
# docker-compose.yml (Base)
# ============================================

cat > templates-nas/docker-compose.yml << 'EOF'
# ============================================
# {{PROJECT_NAME}} - Docker Compose Base
# ============================================
# Usar con docker-compose.dev.yml o docker-compose.prod.yml
# ============================================

version: '3.8'

services:
  frontend:
    container_name: ${PROJECT_NAME}-frontend
    restart: unless-stopped
    depends_on:
      - backend

  backend:
    container_name: ${PROJECT_NAME}-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    container_name: ${PROJECT_NAME}-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    name: ${PROJECT_NAME}-postgres-data
EOF

echo "  ✓ templates-nas/docker-compose.yml"

# ============================================
# docker-compose.dev.yml (NAS)
# ============================================

cat > templates-nas/docker-compose.dev.yml << 'EOF'
# ============================================
# {{PROJECT_NAME}} - Desarrollo (NAS)
# ============================================
# Uso: docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d
# ============================================

version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "${DEV_FRONTEND_PORT:-3000}:3000"
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://localhost:${DEV_BACKEND_PORT:-3001}/api
    networks:
      - dev-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "${DEV_BACKEND_PORT:-3001}:3000"
    volumes:
      - ./backend/src:/app/src
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    networks:
      - dev-network

  postgres:
    ports:
      - "${DEV_DB_PORT:-5432}:5432"
    networks:
      - dev-network

networks:
  dev-network:
    driver: bridge
    name: ${PROJECT_NAME}-dev
EOF

echo "  ✓ templates-nas/docker-compose.dev.yml"

# ============================================
# docker-compose.prod.yml (VPS)
# ============================================

cat > templates-nas/docker-compose.prod.yml << 'EOF'
# ============================================
# {{PROJECT_NAME}} - Producción (VPS)
# ============================================
# Uso: docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d
# ============================================

version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.${PROJECT_NAME}.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.${PROJECT_NAME}.entrypoints=websecure"
      - "traefik.http.routers.${PROJECT_NAME}.tls.certresolver=letsencrypt"
      - "traefik.http.routers.${PROJECT_NAME}.priority=1"
      - "traefik.http.services.${PROJECT_NAME}.loadbalancer.server.port=80"
      - "traefik.docker.network=${TRAEFIK_NETWORK}"
      - "vps-center.project=${PROJECT_NAME}"
      - "vps-center.service=frontend"
    networks:
      - internal
      - ${TRAEFIK_NETWORK}

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.${PROJECT_NAME}-api.rule=Host(`${DOMAIN}`) && PathPrefix(`/api`)"
      - "traefik.http.routers.${PROJECT_NAME}-api.entrypoints=websecure"
      - "traefik.http.routers.${PROJECT_NAME}-api.tls.certresolver=letsencrypt"
      - "traefik.http.routers.${PROJECT_NAME}-api.priority=100"
      - "traefik.http.services.${PROJECT_NAME}-api.loadbalancer.server.port=3000"
      - "traefik.docker.network=${TRAEFIK_NETWORK}"
      - "vps-center.project=${PROJECT_NAME}"
      - "vps-center.service=backend"
    networks:
      - internal
      - ${TRAEFIK_NETWORK}

  postgres:
    labels:
      - "vps-center.project=${PROJECT_NAME}"
      - "vps-center.service=database"
    networks:
      - internal

networks:
  internal:
    driver: bridge
    name: ${PROJECT_NAME}-internal
  n8n_network:
    external: true

EOF

echo "  ✓ templates-nas/docker-compose.prod.yml"

# ============================================
# .env.dev
# ============================================

cat > templates-nas/.env.dev << 'EOF'
# ============================================
# {{PROJECT_NAME}} - Desarrollo (NAS)
# ============================================

PROJECT_NAME={{project_name}}

# Puertos desarrollo
DEV_FRONTEND_PORT=3000
DEV_BACKEND_PORT=3001
DEV_DB_PORT=5432

# Base de datos
POSTGRES_DB={{project_name}}_db
POSTGRES_USER={{project_name}}_user
POSTGRES_PASSWORD=dev_password_123
DATABASE_URL=postgresql://{{project_name}}_user:dev_password_123@postgres:5432/{{project_name}}_db

# Backend
NODE_ENV=development
JWT_SECRET=dev_secret_change_in_production
JWT_EXPIRES_IN=30d
LOG_LEVEL=debug

# Frontend
VITE_API_URL=http://localhost:3001/api
EOF

echo "  ✓ templates-nas/.env.dev"

# ============================================
# .env.prod
# ============================================

cat > templates-nas/.env.prod << 'EOF'
# ============================================
# {{PROJECT_NAME}} - Producción (VPS)
# ============================================

PROJECT_NAME={{project_name}}
DOMAIN={{domain}}
TRAEFIK_NETWORK=n8n_network

# Base de datos
POSTGRES_DB={{project_name}}_db
POSTGRES_USER={{project_name}}_user
POSTGRES_PASSWORD=GENERA_PASSWORD_SEGURO
DATABASE_URL=postgresql://{{project_name}}_user:PASSWORD@postgres:5432/{{project_name}}_db

# Backend
NODE_ENV=production
JWT_SECRET=GENERA_CON_openssl_rand_hex_32
JWT_EXPIRES_IN=7d
LOG_LEVEL=info

# Frontend
VITE_API_URL=/api
EOF

echo "  ✓ templates-nas/.env.prod"

# ============================================
# Dockerfile.dev (Frontend)
# ============================================

cat > templates-nas/frontend/Dockerfile.dev << 'EOF'
# Desarrollo con hot reload
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
EOF

echo "  ✓ templates-nas/frontend/Dockerfile.dev"

# ============================================
# Dockerfile.dev (Backend)
# ============================================

cat > templates-nas/backend/Dockerfile.dev << 'EOF'
# Desarrollo con hot reload
FROM node:20-alpine

WORKDIR /app

RUN npm install -g nodemon ts-node

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["nodemon", "--watch", "src", "--ext", "ts,json", "--exec", "ts-node", "src/index.ts"]
EOF

echo "  ✓ templates-nas/backend/Dockerfile.dev"

# ============================================
# Makefile
# ============================================

cat > templates-nas/Makefile << 'EOF'
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
EOF

echo "  ✓ templates-nas/Makefile"

# ============================================
# deploy.sh
# ============================================

cat > templates-nas/scripts/deploy.sh << 'EOF'
#!/bin/bash
# Deploy a VPS

set -e

VPS_USER="root"
VPS_HOST="82.112.242.139"
PROJECT_NAME="${PROJECT_NAME:-mi-proyecto}"
VPS_PATH="/opt/${PROJECT_NAME}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Deploy a VPS${NC}"

# Verificar cambios
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}Hay cambios sin commitear${NC}"
    git status -s
    read -p "¿Continuar de todos modos? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Push
echo -e "${GREEN}[1/3] Push a GitHub...${NC}"
git push origin main

# Deploy en VPS
echo -e "${GREEN}[2/3] Conectando al VPS...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
    cd ${VPS_PATH}
    echo "[3/3] Pull y rebuild..."
    git pull origin main
    docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d --build
    docker compose ps
ENDSSH

echo -e "${GREEN}✓ Deploy completado${NC}"
EOF

chmod +x templates-nas/scripts/deploy.sh

echo "  ✓ templates-nas/scripts/deploy.sh"

# ============================================
# .gitignore
# ============================================

cat > templates-nas/.gitignore << 'EOF'
# Env files
.env.dev
.env.prod
.env

# Dependencies
node_modules/

# Build
dist/
build/

# Logs
*.log

# IDE
.idea/
.vscode/

# OS
.DS_Store

# Data
backups/
uploads/
*.sqlite
EOF

echo "  ✓ templates-nas/.gitignore"

# ============================================
# Copiar templates comunes
# ============================================

cp templates/frontend/Dockerfile templates-nas/frontend/
cp templates/frontend/nginx.conf templates-nas/frontend/
cp templates/backend/Dockerfile templates-nas/backend/
cp templates/database/init.sql templates-nas/database/
cp templates/.vps-center.yml templates-nas/
cp templates/README.md templates-nas/

echo "  ✓ Copiados templates comunes"

# ============================================
# GIT
# ============================================

echo ""
echo -e "${YELLOW}Subiendo a GitHub...${NC}"

git add docs/NAS_DEV_TEMPLATE.md templates-nas/
git commit -m "docs: add NAS development templates

- Add NAS_DEV_TEMPLATE.md - Development workflow guide
- Add templates-nas/ directory with:
  - docker-compose.yml (base)
  - docker-compose.dev.yml (NAS development)
  - docker-compose.prod.yml (VPS production)
  - .env.dev, .env.prod templates
  - Dockerfile.dev for hot reload
  - Makefile with dev/prod commands
  - deploy.sh script for NAS → VPS"

git push origin main

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✓ Setup Completado           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Estructura creada:"
echo "  /opt/vps-center/docs/"
echo "    └── NAS_DEV_TEMPLATE.md"
echo ""
echo "  /opt/vps-center/templates-nas/"
echo "    ├── docker-compose.yml      (base)"
echo "    ├── docker-compose.dev.yml  (NAS)"
echo "    ├── docker-compose.prod.yml (VPS)"
echo "    ├── .env.dev"
echo "    ├── .env.prod"
echo "    ├── Makefile"
echo "    ├── .gitignore"
echo "    ├── frontend/"
echo "    │   ├── Dockerfile"
echo "    │   ├── Dockerfile.dev"
echo "    │   └── nginx.conf"
echo "    ├── backend/"
echo "    │   ├── Dockerfile"
echo "    │   └── Dockerfile.dev"
echo "    ├── database/"
echo "    │   └── init.sql"
echo "    └── scripts/"
echo "        └── deploy.sh"
echo ""
echo "Uso:"
echo "  1. Copiar templates-nas/ a tu NAS"
echo "  2. Renombrar {{variables}}"
echo "  3. make dev (en NAS)"
echo "  4. make deploy (para subir a VPS)"
echo ""
EOF
