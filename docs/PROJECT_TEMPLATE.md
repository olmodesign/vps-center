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
