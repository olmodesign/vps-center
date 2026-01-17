# 🖥️ VPS CENTER

Dashboard centralizado para gestionar proyectos en VPS con Docker.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Características

### ✅ Implementadas

- **🔐 Autenticación Segura**
  - Login con JWT (access + refresh tokens)
  - 2FA con TOTP (Google Authenticator, Authy)
  - Rate limiting para prevenir ataques
  - Cambio de contraseña

- **📊 Dashboard Inteligente**
  - Detección automática de proyectos desde Docker
  - Estadísticas en tiempo real
  - Vista de puertos públicos
  - Información del sistema (CPU, RAM, Docker version)

- **🐳 Gestión de Contenedores**
  - Listado de todos los contenedores
  - Start / Stop / Restart
  - Visualización de logs
  - Filtros por estado

- **📁 Detección de Proyectos**
  - Agrupación automática por docker-compose
  - Conteo de contenedores por proyecto
  - Estado activo/inactivo
  - Puertos asociados

- **⚙️ Configuración**
  - Perfil de usuario
  - Gestión de 2FA
  - Mapa de puertos

### 🚧 Pendiente (Fases futuras)

- **Terminal Web** - Acceso SSH desde el navegador
- **Sistema de Alertas** - Notificaciones por email/Telegram
- **Monitorización Avanzada** - Gráficos de uso de recursos
- **Portfolio Público** - Vista pública de proyectos seleccionados

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Backend** | Node.js + Express |
| **Base de Datos** | PostgreSQL 16 |
| **Contenedores** | Docker + Docker Compose |
| **Proxy Reverso** | Traefik v2 (SSL automático) |
| **Auth** | JWT + bcrypt + TOTP |

---

## 📁 Estructura del Proyecto
```
vps-center/
├── docker-compose.yml
├── .env
├── README.md
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── api/
│       │   └── client.js
│       ├── hooks/
│       │   └── useAuth.js
│       ├── components/
│       │   ├── layout/
│       │   │   └── MainLayout.jsx
│       │   └── ui/
│       │       └── LoadingScreen.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── Projects.jsx
│           ├── Containers.jsx
│           └── Settings.jsx
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── config/
│       │   ├── database.js
│       │   ├── docker.js
│       │   └── env.js
│       ├── middleware/
│       │   ├── auth.js
│       │   ├── rateLimiter.js
│       │   ├── validator.js
│       │   └── errorHandler.js
│       ├── modules/
│       │   ├── auth/
│       │   ├── projects/
│       │   └── containers/
│       ├── services/
│       │   └── docker.service.js
│       └── utils/
│           ├── logger.js
│           └── crypto.js
│
└── database/
    └── migrations/
        └── 001_initial.sql
```

---

## 🚀 Instalación

### Prerrequisitos

- Docker y Docker Compose
- Traefik configurado con certificados Let's Encrypt
- Dominio apuntando al servidor

### 1. Clonar/Copiar el proyecto
```bash
cd /opt
git clone <repo> vps-center
# o copiar los archivos
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
nano .env
```
```env
# Database
POSTGRES_DB=vps_center
POSTGRES_USER=vps_admin
POSTGRES_PASSWORD=<contraseña-segura>

# JWT Secrets (generar con: openssl rand -base64 64)
JWT_ACCESS_SECRET=<secret-largo-aleatorio>
JWT_REFRESH_SECRET=<otro-secret-largo-aleatorio>

# Admin inicial
ADMIN_EMAIL=tu@email.com
ADMIN_PASSWORD=<contraseña-admin>
```

### 3. Levantar los contenedores
```bash
cd /opt/vps-center
docker-compose up -d --build
```

### 4. Ejecutar migraciones
```bash
docker exec -i vps-center-postgres psql -U vps_admin -d vps_center < database/migrations/001_initial.sql
```

### 5. Crear usuario admin
```bash
# Generar hash de contraseña
docker exec vps-center-backend node -e "
const bcrypt = require('bcrypt');
console.log(bcrypt.hashSync('TU_PASSWORD', 12));
"

# Insertar usuario
docker exec vps-center-postgres psql -U vps_admin -d vps_center -c \
"INSERT INTO users (email, password_hash, role) VALUES ('tu@email.com', 'HASH_GENERADO', 'admin');"
```

### 6. Acceder
```
https://center.tudominio.com
```

---

## 🔧 Configuración de Traefik

El proyecto asume que tienes Traefik corriendo con:

- Red externa: `n8n_network` (cambiar en docker-compose.yml si usas otra)
- Cert resolver: `letsencrypt`
- Entrypoints: `web` (80), `websecure` (443)

---

## 📝 API Endpoints

### Auth
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/login/2fa` | Login con 2FA |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refrescar token |
| GET | `/api/auth/me` | Usuario actual |
| POST | `/api/auth/2fa/setup` | Configurar 2FA |
| POST | `/api/auth/2fa/enable` | Activar 2FA |
| POST | `/api/auth/2fa/disable` | Desactivar 2FA |
| POST | `/api/auth/password/change` | Cambiar contraseña |

### Projects
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/projects` | Listar proyectos |
| GET | `/api/projects/:id` | Obtener proyecto |
| POST | `/api/projects` | Crear proyecto |
| PUT | `/api/projects/:id` | Actualizar proyecto |
| DELETE | `/api/projects/:id` | Eliminar proyecto |

### Containers
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/containers` | Listar contenedores |
| GET | `/api/containers/system` | Info del sistema |
| GET | `/api/containers/detect-projects` | Detectar proyectos |
| GET | `/api/containers/ports` | Listar puertos |
| GET | `/api/containers/:id` | Detalle contenedor |
| GET | `/api/containers/:id/logs` | Logs |
| POST | `/api/containers/:id/start` | Iniciar |
| POST | `/api/containers/:id/stop` | Detener |
| POST | `/api/containers/:id/restart` | Reiniciar |

---

## 🎨 Diseño

El diseño sigue una estética **terminal/industrial**:

- **Colores principales:**
  - Background: `#0a0f14`
  - Surface: `#111922`
  - Border: `#1e2a36`
  - Green (success): `#00ff9f`
  - Cyan (info): `#00d4ff`
  - Yellow (warning): `#ffd93d`
  - Red (error): `#ff6b6b`

- **Tipografía:** JetBrains Mono (monospace)

---

## 🔒 Seguridad

- Passwords hasheados con bcrypt (12 rounds)
- JWT con rotación de tokens
- Rate limiting en endpoints sensibles
- CORS configurado
- Helmet para headers de seguridad
- 2FA opcional con TOTP

---

## 📄 Licencia

MIT License - Libre para uso personal y comercial.

---

## 👨‍💻 Desarrollado por

Tu nombre - [tu@email.com](mailto:tu@email.com)

---

## 🗺️ Roadmap

- [ ] **v1.1** - Terminal Web (xterm.js + WebSocket)
- [ ] **v1.2** - Sistema de Alertas (email, Telegram)
- [ ] **v1.3** - Gráficos de monitorización
- [ ] **v1.4** - Portfolio público
- [ ] **v2.0** - Multi-usuario con permisos
