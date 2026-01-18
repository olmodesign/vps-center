import traefikService from '../../services/traefik.service.js';

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

export default new TraefikController();
