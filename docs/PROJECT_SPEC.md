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
