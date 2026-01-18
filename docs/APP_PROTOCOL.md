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
