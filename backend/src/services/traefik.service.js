import axios from 'axios';

const TRAEFIK_API = process.env.TRAEFIK_API_URL || 'http://traefik:8080/api';

class TraefikService {
  constructor() {
    this.client = axios.create({
      baseURL: TRAEFIK_API,
      timeout: 5000
    });
  }

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
      return { routers: { http: 0, tcp: 0, udp: 0, total: 0 }, services: 0, status: 'unreachable', error: error.message };
    }
  }

  async getRouters() {
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
  }

  async getServices() {
    const response = await this.client.get('/http/services');
    return response.data.map(service => ({
      name: service.name,
      type: service.type,
      status: service.status,
      serverStatus: service.serverStatus,
      loadBalancer: service.loadBalancer,
      provider: service.provider
    }));
  }

  async getMiddlewares() {
    const response = await this.client.get('/http/middlewares');
    return response.data.map(mw => ({
      name: mw.name,
      type: mw.type,
      status: mw.status,
      provider: mw.provider
    }));
  }

  async getEntrypoints() {
    const response = await this.client.get('/entrypoints');
    return response.data;
  }

  async getCertificates() {
    const routers = await this.client.get('/http/routers');
    const tlsRouters = routers.data.filter(r => r.tls);
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
    return Array.from(domains).map(domain => ({ domain, status: 'active', certResolver: 'letsencrypt' }));
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/overview');
      return { status: 'healthy', data: response.data };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default new TraefikService();
