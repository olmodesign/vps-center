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
