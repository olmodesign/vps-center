#!/bin/bash
# ============================================
# VPS Center - Añadir módulo Traefik
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Añadiendo módulo Traefik a VPS Center...${NC}"

cd /opt/vps-center

# ============================================
# BACKEND - traefik.service.js
# ============================================

cat > backend/src/services/traefik.service.js << 'EOF'
const axios = require('axios');

const TRAEFIK_API = process.env.TRAEFIK_API_URL || 'http://traefik:8080/api';

class TraefikService {
  constructor() {
    this.client = axios.create({
      baseURL: TRAEFIK_API,
      timeout: 5000
    });
  }

  // Obtener overview general
  async getOverview() {
    try {
      const [http, tcp, udp] = await Promise.all([
        this.client.get('/http/routers'),
        this.client.get('/tcp/routers').catch(() => ({ data: [] })),
        this.client.get('/udp/routers').catch(() => ({ data: [] }))
      ]);

      const services = await this.client.get('/http/services');

      return {
        routers: {
          http: http.data?.length || 0,
          tcp: tcp.data?.length || 0,
          udp: udp.data?.length || 0,
          total: (http.data?.length || 0) + (tcp.data?.length || 0) + (udp.data?.length || 0)
        },
        services: services.data?.length || 0,
        status: 'healthy'
      };
    } catch (error) {
      console.error('Traefik API error:', error.message);
      return {
        routers: { http: 0, tcp: 0, udp: 0, total: 0 },
        services: 0,
        status: 'unreachable',
        error: error.message
      };
    }
  }

  // Obtener todos los routers HTTP
  async getRouters() {
    try {
      const response = await this.client.get('/http/routers');
      return response.data.map(router => ({
        name: router.name,
        rule: router.rule,
        service: router.service,
        entryPoints: router.entryPoints,
        tls: router.tls ? true : false,
        status: router.status,
        provider: router.provider
      }));
    } catch (error) {
      console.error('Error getting routers:', error.message);
      throw error;
    }
  }

  // Obtener todos los servicios
  async getServices() {
    try {
      const response = await this.client.get('/http/services');
      return response.data.map(service => ({
        name: service.name,
        type: service.type,
        status: service.status,
        serverStatus: service.serverStatus,
        loadBalancer: service.loadBalancer,
        provider: service.provider
      }));
    } catch (error) {
      console.error('Error getting services:', error.message);
      throw error;
    }
  }

  // Obtener middlewares
  async getMiddlewares() {
    try {
      const response = await this.client.get('/http/middlewares');
      return response.data.map(mw => ({
        name: mw.name,
        type: mw.type,
        status: mw.status,
        provider: mw.provider
      }));
    } catch (error) {
      console.error('Error getting middlewares:', error.message);
      throw error;
    }
  }

  // Obtener entrypoints
  async getEntrypoints() {
    try {
      const response = await this.client.get('/entrypoints');
      return response.data;
    } catch (error) {
      console.error('Error getting entrypoints:', error.message);
      throw error;
    }
  }

  // Health check de Traefik
  async healthCheck() {
    try {
      const response = await this.client.get('/overview');
      return {
        status: 'healthy',
        data: response.data
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Obtener info de certificados (parseando routers con TLS)
  async getCertificates() {
    try {
      const routers = await this.client.get('/http/routers');
      const tlsRouters = routers.data.filter(r => r.tls);
      
      // Extraer dominios únicos
      const domains = new Set();
      tlsRouters.forEach(router => {
        const match = router.rule.match(/Host\(`([^`]+)`\)/g);
        if (match) {
          match.forEach(m => {
            const domain = m.match(/Host\(`([^`]+)`\)/)[1];
            domains.add(domain);
          });
        }
      });

      return Array.from(domains).map(domain => ({
        domain,
        status: 'active',
        certResolver: 'letsencrypt'
      }));
    } catch (error) {
      console.error('Error getting certificates:', error.message);
      throw error;
    }
  }
}

module.exports = new TraefikService();
EOF

echo "  ✓ backend/src/services/traefik.service.js"

# ============================================
# BACKEND - traefik module
# ============================================

mkdir -p backend/src/modules/traefik

cat > backend/src/modules/traefik/traefik.controller.js << 'EOF'
const traefikService = require('../../services/traefik.service');

class TraefikController {
  async getOverview(req, res) {
    try {
      const overview = await traefikService.getOverview();
      res.json({ success: true, data: overview });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getRouters(req, res) {
    try {
      const routers = await traefikService.getRouters();
      res.json({ success: true, data: routers });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getServices(req, res) {
    try {
      const services = await traefikService.getServices();
      res.json({ success: true, data: services });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getMiddlewares(req, res) {
    try {
      const middlewares = await traefikService.getMiddlewares();
      res.json({ success: true, data: middlewares });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getEntrypoints(req, res) {
    try {
      const entrypoints = await traefikService.getEntrypoints();
      res.json({ success: true, data: entrypoints });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getCertificates(req, res) {
    try {
      const certificates = await traefikService.getCertificates();
      res.json({ success: true, data: certificates });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async healthCheck(req, res) {
    try {
      const health = await traefikService.healthCheck();
      res.json({ success: true, data: health });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new TraefikController();
EOF

echo "  ✓ backend/src/modules/traefik/traefik.controller.js"

cat > backend/src/modules/traefik/traefik.routes.js << 'EOF'
const express = require('express');
const router = express.Router();
const traefikController = require('./traefik.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authenticate);

router.get('/overview', traefikController.getOverview);
router.get('/routers', traefikController.getRouters);
router.get('/services', traefikController.getServices);
router.get('/middlewares', traefikController.getMiddlewares);
router.get('/entrypoints', traefikController.getEntrypoints);
router.get('/certificates', traefikController.getCertificates);
router.get('/health', traefikController.healthCheck);

module.exports = router;
EOF

echo "  ✓ backend/src/modules/traefik/traefik.routes.js"

# ============================================
# FRONTEND - Traefik.jsx
# ============================================

cat > frontend/src/pages/Traefik.jsx << 'EOF'
import { useState, useEffect } from 'react';
import { 
  GlobeAltIcon, 
  ServerIcon, 
  ShieldCheckIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import api from '../api/axios';

export default function Traefik() {
  const [overview, setOverview] = useState(null);
  const [routers, setRouters] = useState([]);
  const [services, setServices] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [activeTab, setActiveTab] = useState('routers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, routersRes, servicesRes, certsRes] = await Promise.all([
        api.get('/traefik/overview'),
        api.get('/traefik/routers'),
        api.get('/traefik/services'),
        api.get('/traefik/certificates')
      ]);
      
      setOverview(overviewRes.data.data);
      setRouters(routersRes.data.data);
      setServices(servicesRes.data.data);
      setCertificates(certsRes.data.data);
      setError(null);
    } catch (err) {
      setError('Error conectando con Traefik');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'routers', name: 'Routers', count: routers.length },
    { id: 'services', name: 'Services', count: services.length },
    { id: 'certificates', name: 'Certificados', count: certificates.length }
  ];

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Traefik</h1>
          <p className="text-gray-400">Reverse Proxy & Load Balancer</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${overview?.status === 'healthy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {overview?.status === 'healthy' ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-gray-400 text-sm">Estado</p>
              <p className="text-white font-semibold capitalize">{overview?.status || 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <GlobeAltIcon className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Routers</p>
              <p className="text-white font-semibold">{overview?.routers?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ServerIcon className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Services</p>
              <p className="text-white font-semibold">{overview?.services || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <LockClosedIcon className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Certificados SSL</p>
              <p className="text-white font-semibold">{certificates.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.name}
              <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {activeTab === 'routers' && (
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Nombre</th>
                <th className="text-left p-4 text-gray-400 font-medium">Regla</th>
                <th className="text-left p-4 text-gray-400 font-medium">Servicio</th>
                <th className="text-left p-4 text-gray-400 font-medium">TLS</th>
                <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {routers.map((router, idx) => (
                <tr key={idx} className="hover:bg-gray-700/50">
                  <td className="p-4 text-white font-mono text-sm">{router.name}</td>
                  <td className="p-4 text-gray-300 text-sm max-w-md truncate">{router.rule}</td>
                  <td className="p-4 text-gray-300 text-sm">{router.service}</td>
                  <td className="p-4">
                    {router.tls ? (
                      <span className="inline-flex items-center gap-1 text-green-400">
                        <LockClosedIcon className="w-4 h-4" /> SSL
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      router.status === 'enabled' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'
                    }`}>
                      {router.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'services' && (
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Nombre</th>
                <th className="text-left p-4 text-gray-400 font-medium">Tipo</th>
                <th className="text-left p-4 text-gray-400 font-medium">Provider</th>
                <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {services.map((service, idx) => (
                <tr key={idx} className="hover:bg-gray-700/50">
                  <td className="p-4 text-white font-mono text-sm">{service.name}</td>
                  <td className="p-4 text-gray-300 text-sm">{service.type}</td>
                  <td className="p-4 text-gray-300 text-sm">{service.provider}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      service.status === 'enabled' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'
                    }`}>
                      {service.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'certificates' && (
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Dominio</th>
                <th className="text-left p-4 text-gray-400 font-medium">Cert Resolver</th>
                <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {certificates.map((cert, idx) => (
                <tr key={idx} className="hover:bg-gray-700/50">
                  <td className="p-4 text-white font-mono text-sm">{cert.domain}</td>
                  <td className="p-4 text-gray-300 text-sm">{cert.certResolver}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                      <CheckCircleIcon className="w-3 h-3" />
                      {cert.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
EOF

echo "  ✓ frontend/src/pages/Traefik.jsx"

# ============================================
# Instrucciones para actualizar index.js y App.jsx
# ============================================

echo ""
echo -e "${YELLOW}Archivos creados. Ahora hay que:${NC}"
echo ""
echo "1. Añadir la ruta en backend/src/index.js:"
echo "   const traefikRoutes = require('./modules/traefik/traefik.routes');"
echo "   app.use('/api/traefik', traefikRoutes);"
echo ""
echo "2. Añadir la ruta en frontend/src/App.jsx:"
echo "   import Traefik from './pages/Traefik';"
echo "   <Route path=\"/traefik\" element={<Traefik />} />"
echo ""
echo "3. Añadir TRAEFIK_API_URL al .env:"
echo "   TRAEFIK_API_URL=http://traefik:8080/api"
echo ""
echo "4. Rebuild containers:"
echo "   cd /opt/vps-center && docker compose up -d --build"
echo ""

echo -e "${GREEN}✓ Módulo Traefik creado${NC}"
