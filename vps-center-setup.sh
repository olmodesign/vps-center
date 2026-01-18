#!/bin/bash
# ============================================
# VPS Center - Setup Docs & Templates
# ============================================
# Ejecutar en el VPS como root o con sudo
# ============================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   VPS Center - Docs & Templates Setup  ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Directorio base
BASE_DIR="/opt/vps-center"
cd "$BASE_DIR"

# Crear estructura de directorios
echo -e "${YELLOW}Creando estructura de directorios...${NC}"
mkdir -p docs
mkdir -p templates/frontend
mkdir -p templates/backend
mkdir -p templates/database
mkdir -p templates/scripts

# ============================================
# DOCS
# ============================================

echo -e "${YELLOW}Creando documentación...${NC}"

# PROJECT_SPEC.md
cat > docs/PROJECT_SPEC.md << 'ENDOFFILE'
# VPS Center - Especificación de Proyecto

Este documento define el estándar para proyectos desplegados en el VPS y gestionados por VPS Center.

---

## 📁 Estructura de Carpetas Recomendada

```
/opt/nombre-proyecto/
├── docker-compose.yml       # Configuración de servicios (REQUERIDO)
├── docker-compose.prod.yml  # Override para producción (opcional)
├── .env                     # Variables de entorno (REQUERIDO, no commitear)
├── .env.example             # Plantilla de variables (REQUERIDO)
├── .vps-center.yml          # Metadatos para VPS Center (REQUERIDO)
├── README.md                # Documentación del proyecto
├── Makefile                 # Comandos útiles (opcional)
│
├── frontend/                # Si tiene frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── nginx.conf          # Para servir SPA
│   └── src/
│
├── backend/                 # Si tiene backend
│   ├── Dockerfile
│   ├── package.json / requirements.txt / go.mod
│   └── src/
│
└── database/                # Migraciones y seeds
    └── migrations/
```

---

## 📄 Archivo .vps-center.yml (REQUERIDO)

Este archivo permite a VPS Center detectar y gestionar el proyecto correctamente.

```yaml
# Versión del spec
version: 1

# Información del proyecto
project:
  name: "Nombre del Proyecto"
  description: "Descripción breve del proyecto"
  status: production  # development | staging | production | maintenance
  created: "2025-01-17"
  
# Stack tecnológico
stack:
  - name: Node.js
    version: "20"
  - name: PostgreSQL
    version: "16"
  - name: React
    version: "18"

# URLs y dominios
urls:
  production: https://miproyecto.com
  api_docs: https://miproyecto.com/api/docs
  
# Repositorio
repository:
  url: https://github.com/usuario/proyecto
  branch: main

# Puertos utilizados
ports:
  - port: 3000
    type: internal
    service: backend
    description: "API REST"
  - port: 80
    type: internal
    service: frontend
    description: "Frontend Nginx"
  - port: 5432
    type: internal
    service: database
    description: "PostgreSQL"

# Contenedores
containers:
  - name: proyecto-frontend
    service: frontend
    image: proyecto-frontend:latest
    
  - name: proyecto-backend
    service: backend
    image: proyecto-backend:latest
      
  - name: proyecto-postgres
    service: database
    image: postgres:16-alpine

# Volúmenes persistentes
volumes:
  - name: postgres_data
    description: "Datos de PostgreSQL"
    backup: true

# Variables de entorno requeridas
env_vars:
  required:
    - name: DATABASE_URL
      description: "URL de conexión a PostgreSQL"
      
    - name: JWT_SECRET
      description: "Secreto para tokens JWT"
      sensitive: true

# Configuración de Traefik
traefik:
  network: n8n_network
  entrypoint: websecure
  certresolver: letsencrypt
  
# Healthchecks
healthcheck:
  endpoint: /api/health
  interval: 30s
  timeout: 10s
  retries: 3

# Backups
backup:
  enabled: true
  schedule: "0 3 * * *"
  retention: 7
```

---

## 🚀 Checklist Pre-Deploy

- [ ] `.vps-center.yml` creado y completo
- [ ] `.env` configurado (copiado de `.env.example`)
- [ ] Puertos no conflictivos (verificar con VPS Center)
- [ ] Dominio apuntando al VPS
- [ ] Red de Traefik existe (`docker network ls`)
- [ ] Volúmenes definidos para datos persistentes
- [ ] Healthchecks configurados

---

## 📊 Puertos Reservados VPS

| Rango | Uso |
|-------|-----|
| 80, 443 | Traefik (HTTP/HTTPS) |
| 8080 | Traefik Dashboard |
| 3100-3199 | VPS Center |
| 5000-5099 | Proyectos Python/Flask |
| 3000-3099 | Proyectos Node.js |
| 5432-5439 | PostgreSQL |
| 6379 | Redis |

---

## 🔗 Integración con VPS Center

VPS Center detectará automáticamente el proyecto si:

1. Está en `/opt/` o `/srv/`
2. Tiene `docker-compose.yml`
3. Tiene `.vps-center.yml` (opcional pero recomendado)
4. Los contenedores siguen el naming: `proyecto-servicio`

---

*VPS Center v1.0*
ENDOFFILE

echo "  ✓ docs/PROJECT_SPEC.md"

# ============================================
# APP_PROTOCOL.md (versión resumida para el script)
# ============================================

cat > docs/APP_PROTOCOL.md << 'ENDOFFILE'
# VPS Center - Protocolo de Aplicación

Documento técnico que define la arquitectura, APIs, flujos y estándares de VPS Center.

---

## 📐 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TRAEFIK (Reverse Proxy)                      │
│                    center.olmodesign.es → VPS Center                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          VPS CENTER                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      FRONTEND (React)                        │   │
│  │   • Dashboard        • Projects        • Containers          │   │
│  │   • Databases        • Monitoring      • Terminal            │   │
│  │   • Settings         • File Manager    • Logs                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                     │
│                                ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      BACKEND (Node.js/Express)               │   │
│  │   • Auth Service     • Docker Service   • DB Service         │   │
│  │   • Project Scanner  • Metrics Service  • Terminal Service   │   │
│  │   • File Service     • Backup Service   • Notification Svc   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                     │
│                                ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      DATA LAYER                              │   │
│  │   PostgreSQL (config/users)  │  Docker Socket  │  Host FS    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Autenticación

### Flujo JWT + 2FA (TOTP)

1. **Login**: `POST /api/auth/login` → Valida credenciales → `{requires2FA, tempToken}`
2. **2FA**: `POST /api/auth/verify-2fa` → Valida TOTP → `{accessToken, refreshToken}`
3. **Requests**: Header `Authorization: Bearer {accessToken}`
4. **Refresh**: `POST /api/auth/refresh` → Nuevos tokens
5. **Logout**: `POST /api/auth/logout` → Blacklist tokens

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| admin | Control total (`*`) |
| operator | Gestión de contenedores, proyectos, queries DB |
| viewer | Solo lectura |

### Tokens

| Tipo | Expiración |
|------|------------|
| Access Token | 15 min |
| Refresh Token | 7 días |
| Temp Token (2FA) | 5 min |

---

## 🌐 API REST

### Base URL
```
https://center.olmodesign.es/api/v1
```

### Endpoints Principales

#### Autenticación
```
POST   /auth/login              # Login inicial
POST   /auth/verify-2fa         # Verificar TOTP
POST   /auth/refresh            # Refrescar tokens
POST   /auth/logout             # Cerrar sesión
GET    /auth/me                 # Usuario actual
```

#### Proyectos
```
GET    /projects                # Listar proyectos
GET    /projects/:id            # Detalle de proyecto
GET    /projects/:id/status     # Estado de contenedores
POST   /projects/:id/scan       # Re-escanear proyecto
```

#### Contenedores
```
GET    /containers              # Listar contenedores
GET    /containers/:id          # Detalle
GET    /containers/:id/stats    # Métricas
GET    /containers/:id/logs     # Logs
POST   /containers/:id/start    # Iniciar
POST   /containers/:id/stop     # Detener
POST   /containers/:id/restart  # Reiniciar
```

#### Bases de Datos
```
GET    /databases               # Listar DBs
GET    /databases/:id/tables    # Listar tablas
POST   /databases/:id/query     # Ejecutar SELECT
```

#### Monitorización
```
GET    /monitoring/system       # Métricas del sistema
GET    /monitoring/containers   # Métricas de contenedores
WS     /monitoring/live         # WebSocket tiempo real
```

### Respuesta Estándar

```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

### Códigos de Error

| Código | HTTP | Descripción |
|--------|------|-------------|
| AUTH_REQUIRED | 401 | Token no proporcionado |
| AUTH_INVALID | 401 | Token inválido |
| FORBIDDEN | 403 | Sin permisos |
| NOT_FOUND | 404 | Recurso no encontrado |
| VALIDATION_ERROR | 400 | Datos inválidos |
| RATE_LIMITED | 429 | Demasiadas peticiones |

---

## 🔍 Detección de Proyectos

VPS Center escanea `/opt/` y `/srv/` buscando:

1. `docker-compose.yml` → Proyecto Docker
2. `.vps-center.yml` → Metadatos del proyecto
3. Labels de Traefik → Dominios y routing

### Detección de Stack

| Tecnología | Detectado por |
|------------|---------------|
| Node.js | `package.json`, imagen `node:*` |
| Python | `requirements.txt`, imagen `python:*` |
| PostgreSQL | Puerto 5432, imagen `postgres:*` |
| React | `"react":` en package.json |
| Nginx | `nginx.conf`, imagen `nginx:*` |

---

## 🔒 Seguridad

### Rate Limiting

| Endpoint | Límite |
|----------|--------|
| Global | 100/min |
| Login | 5/min |
| 2FA | 5/min |
| Docker exec | 10/min |
| DB Query | 30/min |

### Queries de BD

- **Solo SELECT permitido**
- Keywords bloqueados: INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE
- Timeout: 30 segundos
- Máximo 1000 filas por query

### Audit Log

Todas las operaciones de escritura y accesos sensibles se registran con:
- Usuario, acción, recurso
- IP, User-Agent, timestamp

---

## 📊 Monitorización

### Métricas del Sistema
- CPU: uso %, cores, load average
- Memoria: total, usado, libre
- Disco: total, usado, IOPS
- Red: bytes in/out

### Métricas de Contenedor
- CPU: uso %
- Memoria: uso/límite
- Red: rx/tx bytes
- Block I/O: read/write

### Alertas Automáticas

| Alerta | Condición | Severidad |
|--------|-----------|-----------|
| High CPU | >90% por 5min | warning |
| Critical CPU | >98% por 2min | critical |
| Low Disk | >85% | warning |
| Container Down | status=exited | warning |

---

## 🗄️ Base de Datos VPS Center

### Tablas Principales

- `users` - Usuarios del sistema
- `projects` - Proyectos detectados
- `databases` - BDs externas
- `token_blacklist` - Tokens revocados
- `audit_log` - Historial de acciones
- `settings` - Configuración
- `alerts` - Alertas
- `backup_jobs` - Trabajos de backup

---

## 📋 Checklist de Implementación

### Fase 1: Core ✅
- [x] Autenticación JWT + 2FA
- [x] Validación con Zod
- [x] Rate limiting

### Fase 2: Docker
- [ ] Conexión Docker socket
- [ ] CRUD contenedores
- [ ] Logs y stats

### Fase 3: Project Scanner
- [ ] Escaneo /opt y /srv
- [ ] Parser docker-compose
- [ ] Parser .vps-center.yml

### Fase 4: Databases
- [ ] Detección de DBs
- [ ] Query executor (SELECT)
- [ ] Backups

### Fase 5: Monitoring
- [ ] Métricas sistema
- [ ] WebSocket tiempo real
- [ ] Sistema de alertas

### Fase 6: Advanced
- [ ] Terminal web
- [ ] File manager
- [ ] Backups
- [ ] Notificaciones

### Fase 7: Frontend
- [ ] Dashboard
- [ ] Projects
- [ ] Containers
- [ ] Databases
- [ ] Monitoring
- [ ] Settings

---

*VPS Center v1.0 - Protocolo de Aplicación*
ENDOFFILE

echo "  ✓ docs/APP_PROTOCOL.md"

# ============================================
# PROJECT_TEMPLATE.md
# ============================================

cat > docs/PROJECT_TEMPLATE.md << 'ENDOFFILE'
# 🚀 VPS Center - Plantilla de Proyecto

> **Propósito**: Adjunta este documento al crear un nuevo proyecto en Claude para generar automáticamente toda la estructura compatible con VPS Center.

---

## 📋 Flujo de Trabajo

```
┌─────────────────────────────────────────────────────────────┐
│                    CREAR NUEVO PROYECTO                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Crear Proyecto en Claude.ai                              │
│     - Nombre: "Nuevo Proyecto X"                             │
│     - Adjuntar: PROJECT_TEMPLATE.md                          │
│     - Opcional: APP_PROTOCOL.md (si necesitas referencia)    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Describir el proyecto                                    │
│     "Quiero crear un proyecto llamado 'mi-app' con:          │
│      - Frontend React + Tailwind                             │
│      - Backend Node.js + Express                             │
│      - PostgreSQL                                            │
│      - Dominio: miapp.olmodesign.es"                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Claude genera toda la estructura:                        │
│     - Todos los archivos configurados                        │
│     - Comandos para ejecutar en el VPS                       │
│     - docker-compose.yml listo                               │
│     - .vps-center.yml para detección automática              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura Generada

```
/opt/{nombre-proyecto}/
│
├── 📄 docker-compose.yml          # Orquestación de servicios
├── 📄 .env                        # Variables de entorno (NO COMMITEAR)
├── 📄 .env.example                # Plantilla de variables
├── 📄 .vps-center.yml             # Metadatos para VPS Center
├── 📄 .gitignore                  # Archivos ignorados
├── 📄 README.md                   # Documentación
├── 📄 Makefile                    # Comandos útiles
│
├── 📂 frontend/
│   ├── 📄 Dockerfile
│   ├── 📄 nginx.conf
│   └── 📂 src/
│
├── 📂 backend/
│   ├── 📄 Dockerfile
│   └── 📂 src/
│
├── 📂 database/
│   └── 📄 init.sql
│
└── 📂 scripts/
    └── 📄 healthcheck.sh
```

---

## 📝 Configuración del Proyecto

Completa esta información al solicitar la generación:

```yaml
proyecto:
  nombre: "mi-proyecto"                    # kebab-case
  nombre_display: "Mi Proyecto"            # Para mostrar
  descripcion: "Descripción del proyecto"
  dominio: "miproyecto.olmodesign.es"
  
stack:
  frontend: React + Vite + Tailwind
  backend: Node.js + Express
  database: PostgreSQL
  
puertos:
  frontend: 80
  backend: 3000
  database: 5432
  
red:
  traefik_network: "n8n_network"
```

---

## 📊 Puertos Reservados

| Rango | Uso |
|-------|-----|
| 80, 443 | Traefik |
| 8080 | Traefik Dashboard |
| 3100-3199 | VPS Center |
| 3000-3099 | Node.js |
| 5000-5099 | Python |
| 5432-5439 | PostgreSQL |
| 6379 | Redis |

---

## ✅ Checklist Pre-Deploy

- [ ] `.vps-center.yml` creado
- [ ] `.env` configurado
- [ ] Secretos generados (JWT_SECRET, passwords)
- [ ] Dominio apuntando al VPS
- [ ] Red Traefik existe: `docker network ls | grep n8n_network`
- [ ] Puertos no conflictivos

---

## 🔗 Templates Disponibles

Los archivos base están en `/opt/vps-center/templates/`:

```bash
# Ver templates disponibles
ls -la /opt/vps-center/templates/

# Copiar template a nuevo proyecto
cp -r /opt/vps-center/templates/ /opt/mi-nuevo-proyecto/
```

---

*VPS Center v1.0 - Plantilla de Proyecto*
ENDOFFILE

echo "  ✓ docs/PROJECT_TEMPLATE.md"

# ============================================
# TEMPLATES
# ============================================

echo -e "${YELLOW}Creando templates...${NC}"

# docker-compose.yml
cat > templates/docker-compose.yml << 'ENDOFFILE'
# ============================================
# {{PROJECT_NAME}} - Docker Compose
# ============================================
# Generado para VPS Center
# Reemplazar {{VARIABLES}} antes de usar
# ============================================

version: '3.8'

services:
  # ==========================================
  # FRONTEND
  # ==========================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=/api
    container_name: ${PROJECT_NAME}-frontend
    restart: unless-stopped
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
    depends_on:
      - backend
    networks:
      - internal
      - ${TRAEFIK_NETWORK}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ==========================================
  # BACKEND
  # ==========================================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ${PROJECT_NAME}-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - PORT=${BACKEND_PORT:-3000}
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}
      - LOG_LEVEL=${LOG_LEVEL:-info}
    volumes:
      - uploads:/app/uploads
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.${PROJECT_NAME}-api.rule=Host(`${DOMAIN}`) && PathPrefix(`/api`)"
      - "traefik.http.routers.${PROJECT_NAME}-api.entrypoints=websecure"
      - "traefik.http.routers.${PROJECT_NAME}-api.tls.certresolver=letsencrypt"
      - "traefik.http.routers.${PROJECT_NAME}-api.priority=100"
      - "traefik.http.services.${PROJECT_NAME}-api.loadbalancer.server.port=${BACKEND_PORT:-3000}"
      - "traefik.docker.network=${TRAEFIK_NETWORK}"
      - "vps-center.project=${PROJECT_NAME}"
      - "vps-center.service=backend"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - internal
      - ${TRAEFIK_NETWORK}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${BACKEND_PORT:-3000}/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ==========================================
  # DATABASE
  # ==========================================
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
    labels:
      - "vps-center.project=${PROJECT_NAME}"
      - "vps-center.service=database"
      - "vps-center.database.type=postgresql"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - internal

networks:
  internal:
    driver: bridge
    name: ${PROJECT_NAME}-internal
  n8n_network:
    external: true

volumes:
  postgres_data:
    name: ${PROJECT_NAME}-postgres-data
  uploads:
    name: ${PROJECT_NAME}-uploads
ENDOFFILE

echo "  ✓ templates/docker-compose.yml"

# .env.example
cat > templates/.env.example << 'ENDOFFILE'
# ============================================
# {{PROJECT_NAME}} - Variables de Entorno
# ============================================
# Copia a .env y configura los valores
# NUNCA commitear .env
# ============================================

# Identificación
PROJECT_NAME={{project_name}}
DOMAIN={{domain}}

# Entorno
NODE_ENV=production
LOG_LEVEL=info

# Red Traefik
TRAEFIK_NETWORK=n8n_network

# Base de datos
POSTGRES_DB={{project_name}}_db
POSTGRES_USER={{project_name}}_user
POSTGRES_PASSWORD=GENERA_PASSWORD_SEGURO

DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}

# Backend
BACKEND_PORT=3000

# JWT - Generar con: openssl rand -hex 32
JWT_SECRET=GENERA_SECRETO_JWT
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Frontend (build time)
VITE_API_URL=/api
ENDOFFILE

echo "  ✓ templates/.env.example"

# .vps-center.yml
cat > templates/.vps-center.yml << 'ENDOFFILE'
# ============================================
# VPS CENTER - Configuración de Proyecto
# ============================================

version: 1

project:
  name: "{{PROJECT_DISPLAY_NAME}}"
  description: "{{PROJECT_DESCRIPTION}}"
  status: development
  created: "{{DATE}}"
  maintainer: "oscar@olmodesign.es"

stack:
  - name: Node.js
    version: "20"
  - name: PostgreSQL
    version: "16"
  - name: React
    version: "18"
  - name: Nginx
    version: "alpine"

urls:
  production: "https://{{DOMAIN}}"
  api: "https://{{DOMAIN}}/api"
  health: "https://{{DOMAIN}}/api/health"

repository:
  url: "{{REPO_URL}}"
  branch: "main"

ports:
  - port: 80
    type: internal
    service: frontend
    description: "Frontend Nginx"
  - port: 3000
    type: internal
    service: backend
    description: "API REST"
  - port: 5432
    type: internal
    service: database
    description: "PostgreSQL"

containers:
  - name: "{{PROJECT_NAME}}-frontend"
    service: frontend
  - name: "{{PROJECT_NAME}}-backend"
    service: backend
  - name: "{{PROJECT_NAME}}-postgres"
    service: database

volumes:
  - name: postgres_data
    description: "Datos de PostgreSQL"
    backup: true
  - name: uploads
    description: "Archivos subidos"
    backup: true

traefik:
  network: n8n_network
  entrypoint: websecure
  certresolver: letsencrypt

healthcheck:
  endpoint: /api/health
  interval: 30s
  timeout: 10s
  retries: 3

backup:
  enabled: true
  schedule: "0 3 * * *"
  retention: 7
ENDOFFILE

echo "  ✓ templates/.vps-center.yml"

# .gitignore
cat > templates/.gitignore << 'ENDOFFILE'
# Entorno
.env
.env.local
.env.*.local

# Dependencias
node_modules/
__pycache__/
venv/

# Build
dist/
build/

# Logs
*.log

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store

# Docker
docker-compose.override.yml

# Datos
uploads/
*.sqlite
*.db
backups/

# Secretos
*.pem
*.key
ENDOFFILE

echo "  ✓ templates/.gitignore"

# Makefile
cat > templates/Makefile << 'ENDOFFILE'
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
ENDOFFILE

echo "  ✓ templates/Makefile"

# README.md
cat > templates/README.md << 'ENDOFFILE'
# {{PROJECT_DISPLAY_NAME}}

{{PROJECT_DESCRIPTION}}

## 🔗 URLs

| Entorno | URL |
|---------|-----|
| Producción | https://{{DOMAIN}} |
| API | https://{{DOMAIN}}/api |

## 🛠️ Stack

- **Frontend**: React + Vite + Tailwind
- **Backend**: Node.js + Express
- **Database**: PostgreSQL 16
- **Proxy**: Nginx + Traefik

## 🚀 Inicio Rápido

```bash
# Clonar
git clone {{REPO_URL}}
cd {{PROJECT_NAME}}

# Configurar
cp .env.example .env
nano .env

# Iniciar
docker compose up -d
```

## 📋 Comandos

```bash
make help        # Ver comandos
make up          # Iniciar
make down        # Detener
make logs        # Ver logs
make db-shell    # Acceder a PostgreSQL
make backup      # Crear backup
```

## 📊 Monitorización

Gestionado por **VPS Center**: https://center.olmodesign.es

---

*Generado para VPS Center v1.0*
ENDOFFILE

echo "  ✓ templates/README.md"

# Frontend Dockerfile
cat > templates/frontend/Dockerfile << 'ENDOFFILE'
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
ENDOFFILE

echo "  ✓ templates/frontend/Dockerfile"

# nginx.conf
cat > templates/frontend/nginx.conf << 'ENDOFFILE'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /health {
        access_log off;
        return 200 "OK";
    }
}
ENDOFFILE

echo "  ✓ templates/frontend/nginx.conf"

# Backend Dockerfile
cat > templates/backend/Dockerfile << 'ENDOFFILE'
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app
USER nodejs
ENV NODE_ENV=production PORT=3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1
EXPOSE ${PORT}
CMD ["node", "dist/index.js"]
ENDOFFILE

echo "  ✓ templates/backend/Dockerfile"

# Database init.sql
cat > templates/database/init.sql << 'ENDOFFILE'
-- ============================================
-- Database Initialization
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabla de ejemplo
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_users_email ON users(email);
ENDOFFILE

echo "  ✓ templates/database/init.sql"

# healthcheck.sh
cat > templates/scripts/healthcheck.sh << 'ENDOFFILE'
#!/bin/bash
# Health Check Script

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Health Check"
echo "============"

echo -n "Frontend: "
curl -sf http://localhost/ > /dev/null && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAILED${NC}"

echo -n "Backend:  "
curl -sf http://localhost:3000/api/health > /dev/null && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAILED${NC}"

echo -n "Database: "
docker compose exec -T postgres pg_isready > /dev/null 2>&1 && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAILED${NC}"
ENDOFFILE

chmod +x templates/scripts/healthcheck.sh

echo "  ✓ templates/scripts/healthcheck.sh"

# ============================================
# GIT
# ============================================

echo ""
echo -e "${YELLOW}Subiendo a GitHub...${NC}"

git add docs/ templates/
git commit -m "docs: add documentation and project templates

- Add APP_PROTOCOL.md - Application architecture and API docs
- Add PROJECT_SPEC.md - Project standards specification
- Add PROJECT_TEMPLATE.md - Template guide for new projects
- Add templates/ directory with base files:
  - docker-compose.yml
  - .env.example
  - .vps-center.yml
  - .gitignore
  - Makefile
  - README.md
  - frontend/Dockerfile, nginx.conf
  - backend/Dockerfile
  - database/init.sql
  - scripts/healthcheck.sh"

git push origin main

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✓ Setup Completado           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Estructura creada:"
echo "  /opt/vps-center/docs/"
echo "    ├── APP_PROTOCOL.md"
echo "    ├── PROJECT_SPEC.md"
echo "    └── PROJECT_TEMPLATE.md"
echo ""
echo "  /opt/vps-center/templates/"
echo "    ├── docker-compose.yml"
echo "    ├── .env.example"
echo "    ├── .vps-center.yml"
echo "    ├── .gitignore"
echo "    ├── Makefile"
echo "    ├── README.md"
echo "    ├── frontend/"
echo "    ├── backend/"
echo "    ├── database/"
echo "    └── scripts/"
echo ""
