import docker from '../config/docker.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

// Mapeo de imágenes a tecnologías
const TECH_MAP = {
  'node': 'Node.js',
  'postgres': 'PostgreSQL',
  'mysql': 'MySQL',
  'mariadb': 'MariaDB',
  'mongo': 'MongoDB',
  'redis': 'Redis',
  'nginx': 'Nginx',
  'traefik': 'Traefik',
  'python': 'Python',
  'php': 'PHP',
  'ruby': 'Ruby',
  'golang': 'Go',
  'java': 'Java',
  'openjdk': 'Java',
  'dotnet': '.NET',
  'elasticsearch': 'Elasticsearch',
  'rabbitmq': 'RabbitMQ',
  'memcached': 'Memcached',
  'adminer': 'Adminer',
  'pgadmin': 'pgAdmin',
  'grafana': 'Grafana',
  'prometheus': 'Prometheus',
  'jenkins': 'Jenkins',
  'gitlab': 'GitLab',
  'n8n': 'n8n',
  'strapi': 'Strapi',
  'wordpress': 'WordPress',
  'ghost': 'Ghost',
};

function detectTechFromImage(image) {
  const imageLower = image.toLowerCase();
  for (const [key, value] of Object.entries(TECH_MAP)) {
    if (imageLower.includes(key)) {
      return value;
    }
  }
  return null;
}

function detectDatabaseInfo(container) {
  const image = container.Image.toLowerCase();
  
  if (image.includes('postgres')) {
    return {
      type: 'PostgreSQL',
      version: image.split(':')[1] || 'latest',
      port: 5432,
      envUser: 'POSTGRES_USER',
      envPassword: 'POSTGRES_PASSWORD',
      envDatabase: 'POSTGRES_DB',
    };
  }
  if (image.includes('mysql') || image.includes('mariadb')) {
    return {
      type: image.includes('mariadb') ? 'MariaDB' : 'MySQL',
      version: image.split(':')[1] || 'latest',
      port: 3306,
      envUser: 'MYSQL_USER',
      envPassword: 'MYSQL_PASSWORD',
      envDatabase: 'MYSQL_DATABASE',
    };
  }
  if (image.includes('mongo')) {
    return {
      type: 'MongoDB',
      version: image.split(':')[1] || 'latest',
      port: 27017,
      envUser: 'MONGO_INITDB_ROOT_USERNAME',
      envPassword: 'MONGO_INITDB_ROOT_PASSWORD',
      envDatabase: 'MONGO_INITDB_DATABASE',
    };
  }
  if (image.includes('redis')) {
    return {
      type: 'Redis',
      version: image.split(':')[1] || 'latest',
      port: 6379,
    };
  }
  return null;
}

function extractTraefikDomain(labels) {
  // Buscar reglas de Traefik para extraer el dominio
  for (const [key, value] of Object.entries(labels || {})) {
    if (key.includes('traefik') && key.includes('rule') && value.includes('Host')) {
      // Extraer dominio de Host(`domain.com`)
      const match = value.match(/Host\(`([^`]+)`\)/);
      if (match) return match[1];
    }
  }
  return null;
}

class DockerService {
  async getAllContainers(all = true) {
    try {
      const containers = await docker.listContainers({ all });
      return containers.map((container) => ({
        id: container.Id,
        shortId: container.Id.substring(0, 12),
        name: container.Names[0]?.replace(/^\//, '') || 'unnamed',
        names: container.Names.map((name) => name.replace(/^\//, '')),
        image: container.Image,
        state: container.State,
        status: container.Status,
        created: container.Created,
        ports: container.Ports,
        labels: container.Labels,
      }));
    } catch (error) {
      logger.error('Failed to get containers:', error);
      throw new AppError('Failed to fetch containers', 500, 'DOCKER_ERROR');
    }
  }

  async getContainer(containerId) {
    try {
      const container = docker.getContainer(containerId);
      const info = await container.inspect();
      return {
        id: info.Id,
        shortId: info.Id.substring(0, 12),
        name: info.Name.replace(/^\//, ''),
        image: info.Config.Image,
        created: info.Created,
        state: { status: info.State.Status, running: info.State.Running, paused: info.State.Paused, startedAt: info.State.StartedAt, finishedAt: info.State.FinishedAt },
        config: { env: info.Config.Env, cmd: info.Config.Cmd, labels: info.Config.Labels },
        network: { ports: info.NetworkSettings.Ports, networks: Object.keys(info.NetworkSettings.Networks) },
        mounts: info.Mounts,
      };
    } catch (error) {
      if (error.statusCode === 404) throw new AppError('Container not found', 404, 'CONTAINER_NOT_FOUND');
      logger.error('Failed to get container:', error);
      throw new AppError('Failed to fetch container details', 500, 'DOCKER_ERROR');
    }
  }

  async getContainerStats(containerId) {
    try {
      const container = docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100 : 0;
      const memoryUsage = stats.memory_stats.usage || 0;
      const memoryLimit = stats.memory_stats.limit || 0;
      const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;

      return {
        cpu: { percent: cpuPercent.toFixed(2), cores: stats.cpu_stats.online_cpus },
        memory: { usage: memoryUsage, limit: memoryLimit, percent: memoryPercent.toFixed(2) },
        pids: stats.pids_stats?.current || 0,
      };
    } catch (error) {
      logger.error('Failed to get container stats:', error);
      throw new AppError('Failed to fetch container stats', 500, 'DOCKER_ERROR');
    }
  }

  async startContainer(containerId) {
    try {
      const container = docker.getContainer(containerId);
      await container.start();
      logger.info('Container started', { containerId });
      return { success: true, message: 'Container started' };
    } catch (error) {
      if (error.statusCode === 304) return { success: true, message: 'Container already running' };
      logger.error('Failed to start container:', error);
      throw new AppError('Failed to start container', 500, 'DOCKER_ERROR');
    }
  }

  async stopContainer(containerId) {
    try {
      const container = docker.getContainer(containerId);
      await container.stop();
      logger.info('Container stopped', { containerId });
      return { success: true, message: 'Container stopped' };
    } catch (error) {
      if (error.statusCode === 304) return { success: true, message: 'Container already stopped' };
      logger.error('Failed to stop container:', error);
      throw new AppError('Failed to stop container', 500, 'DOCKER_ERROR');
    }
  }

  async restartContainer(containerId) {
    try {
      const container = docker.getContainer(containerId);
      await container.restart();
      logger.info('Container restarted', { containerId });
      return { success: true, message: 'Container restarted' };
    } catch (error) {
      logger.error('Failed to restart container:', error);
      throw new AppError('Failed to restart container', 500, 'DOCKER_ERROR');
    }
  }

  async getContainerLogs(containerId, options = {}) {
    try {
      const { tail = 100, timestamps = true } = options;
      const container = docker.getContainer(containerId);
      const logs = await container.logs({ stdout: true, stderr: true, tail, timestamps });
      const logsString = logs.toString('utf8');
      return logsString.split('\n').filter((line) => line.trim()).map((line) => line.length > 8 ? line.substring(8) : line);
    } catch (error) {
      logger.error('Failed to get container logs:', error);
      throw new AppError('Failed to fetch container logs', 500, 'DOCKER_ERROR');
    }
  }

  async getSystemInfo() {
    try {
      const info = await docker.info();
      return {
        containers: { total: info.Containers, running: info.ContainersRunning, paused: info.ContainersPaused, stopped: info.ContainersStopped },
        images: info.Images,
        memoryTotal: info.MemTotal,
        cpus: info.NCPU,
        operatingSystem: info.OperatingSystem,
        dockerVersion: info.ServerVersion,
      };
    } catch (error) {
      logger.error('Failed to get system info:', error);
      throw new AppError('Failed to fetch system info', 500, 'DOCKER_ERROR');
    }
  }

  async getAllImages() {
    try {
      const images = await docker.listImages();
      return images.map((image) => ({ id: image.Id, shortId: image.Id.replace('sha256:', '').substring(0, 12), tags: image.RepoTags || [], size: image.Size }));
    } catch (error) {
      logger.error('Failed to get images:', error);
      throw new AppError('Failed to fetch images', 500, 'DOCKER_ERROR');
    }
  }

  async getAllNetworks() {
    try {
      const networks = await docker.listNetworks();
      return networks.map((network) => ({ id: network.Id, name: network.Name, driver: network.Driver, scope: network.Scope }));
    } catch (error) {
      logger.error('Failed to get networks:', error);
      throw new AppError('Failed to fetch networks', 500, 'DOCKER_ERROR');
    }
  }

  async getAllVolumes() {
    try {
      const { Volumes: volumes } = await docker.listVolumes();
      return volumes.map((volume) => ({ name: volume.Name, driver: volume.Driver, mountpoint: volume.Mountpoint }));
    } catch (error) {
      logger.error('Failed to get volumes:', error);
      throw new AppError('Failed to fetch volumes', 500, 'DOCKER_ERROR');
    }
  }

  async detectProjects() {
    try {
      const containers = await docker.listContainers({ all: true });
      const projectMap = new Map();
      
      containers.forEach((container) => {
        const name = container.Names[0]?.replace(/^\//, '') || '';
        let projectName = name.split(/[-_]/)[0];
        
        if (container.Labels['com.docker.compose.project']) {
          projectName = container.Labels['com.docker.compose.project'];
        }
        
        if (!projectMap.has(projectName)) {
          projectMap.set(projectName, { name: projectName, containers: [], ports: [], status: 'inactive', stack: new Set() });
        }
        
        const project = projectMap.get(projectName);
        project.containers.push({ id: container.Id.substring(0, 12), name: name, image: container.Image, state: container.State });
        
        if (container.State === 'running') {
          project.status = 'active';
        }
        
        const tech = detectTechFromImage(container.Image);
        if (tech) project.stack.add(tech);
        
        container.Ports.forEach((port) => {
          if (port.PublicPort) {
            project.ports.push({ public: port.PublicPort, private: port.PrivatePort, type: port.Type });
          }
        });
      });
      
      const projects = Array.from(projectMap.values()).map(p => ({
        ...p,
        stack: Array.from(p.stack)
      }));
      
      return projects;
    } catch (error) {
      logger.error('Failed to detect projects:', error);
      throw new AppError('Failed to detect projects', 500, 'DOCKER_ERROR');
    }
  }

  async getProjectDetail(projectName) {
    try {
      const containers = await docker.listContainers({ all: true });
      const projectContainers = [];
      const ports = [];
      const databases = [];
      const apis = [];
      const stack = new Set();
      const volumes = new Set();
      const networks = new Set();
      let status = 'inactive';

      for (const container of containers) {
        const name = container.Names[0]?.replace(/^\//, '') || '';
        let containerProject = name.split(/[-_]/)[0];
        
        if (container.Labels['com.docker.compose.project']) {
          containerProject = container.Labels['com.docker.compose.project'];
        }

        if (containerProject !== projectName) continue;

        const containerObj = docker.getContainer(container.Id);
        const info = await containerObj.inspect();

        const containerInfo = {
          id: container.Id,
          shortId: container.Id.substring(0, 12),
          name: name,
          image: container.Image,
          state: container.State,
          status: container.Status,
          created: info.Created,
          env: info.Config.Env || [],
          labels: container.Labels || {},
        };

        projectContainers.push(containerInfo);

        if (container.State === 'running') status = 'active';

        const tech = detectTechFromImage(container.Image);
        if (tech) stack.add(tech);

        container.Ports.forEach((port) => {
          ports.push({
            public: port.PublicPort || null,
            private: port.PrivatePort,
            type: port.Type || 'tcp',
            container: name,
          });
        });

        (info.Mounts || []).forEach((mount) => {
          volumes.add(JSON.stringify({
            type: mount.Type,
            source: mount.Source,
            destination: mount.Destination,
            container: name,
          }));
        });

        Object.keys(info.NetworkSettings.Networks || {}).forEach((net) => {
          networks.add(net);
        });

        const dbInfo = detectDatabaseInfo(container);
        if (dbInfo) {
          const envVars = info.Config.Env || [];
          const getEnv = (key) => {
            const found = envVars.find(e => e.startsWith(key + '='));
            return found ? found.split('=')[1] : null;
          };

          databases.push({
            ...dbInfo,
            container: name,
            containerId: container.Id.substring(0, 12),
            user: dbInfo.envUser ? getEnv(dbInfo.envUser) : null,
            database: dbInfo.envDatabase ? getEnv(dbInfo.envDatabase) : null,
            host: name,
          });
        }

        // Detectar API - mejorado para soportar Traefik
        const isBackend = name.includes('backend') || name.includes('api') || name.includes('server');
        if (isBackend && container.State === 'running') {
          // Buscar dominio en Traefik labels
          const traefikDomain = extractTraefikDomain(container.Labels);
          
          // Buscar puerto público o privado
          const apiPort = container.Ports.find(p => p.PublicPort);
          const privatePort = container.Ports.find(p => p.PrivatePort);
          
          const apiInfo = {
            container: name,
            containerId: container.Id.substring(0, 12),
            port: apiPort?.PublicPort || null,
            privatePort: privatePort?.PrivatePort || null,
            domain: traefikDomain,
            url: traefikDomain ? `https://${traefikDomain}` : null,
            docsUrl: traefikDomain ? `https://${traefikDomain}/docs` : null,
            healthUrl: traefikDomain ? `https://${traefikDomain}/health` : null,
          };
          
          apis.push(apiInfo);
        }

        // También detectar frontend con Traefik
        const isFrontend = name.includes('frontend') || name.includes('web') || name.includes('app');
        if (isFrontend && container.State === 'running') {
          const traefikDomain = extractTraefikDomain(container.Labels);
          if (traefikDomain && !apis.find(a => a.domain === traefikDomain)) {
            apis.push({
              container: name,
              containerId: container.Id.substring(0, 12),
              type: 'frontend',
              domain: traefikDomain,
              url: `https://${traefikDomain}`,
            });
          }
        }
      }

      return {
        name: projectName,
        status,
        containers: projectContainers,
        ports: ports.filter(p => p.public).sort((a, b) => a.public - b.public),
        allPorts: ports,
        stack: Array.from(stack),
        databases,
        apis,
        volumes: Array.from(volumes).map(v => JSON.parse(v)),
        networks: Array.from(networks),
      };
    } catch (error) {
      logger.error('Failed to get project detail:', error);
      throw new AppError('Failed to get project detail', 500, 'DOCKER_ERROR');
    }
  }

  async getAllPorts() {
    try {
      const containers = await docker.listContainers({ all: true });
      const ports = [];
      
      containers.forEach((container) => {
        const name = container.Names[0]?.replace(/^\//, '') || 'unknown';
        container.Ports.forEach((port) => {
          if (port.PublicPort || port.PrivatePort) {
            ports.push({ container: name, image: container.Image, public: port.PublicPort || null, private: port.PrivatePort, type: port.Type || 'tcp' });
          }
        });
      });
      
      return ports.sort((a, b) => (a.public || 0) - (b.public || 0));
    } catch (error) {
      logger.error('Failed to get ports:', error);
      throw new AppError('Failed to get ports', 500, 'DOCKER_ERROR');
    }
  }

  async execInContainer(containerId, cmd) {
    try {
      const container = docker.getContainer(containerId);
      const exec = await container.exec({
        Cmd: ['sh', '-c', cmd],
        AttachStdout: true,
        AttachStderr: true,
      });
      const stream = await exec.start({ hijack: true, stdin: false });
      
      return new Promise((resolve, reject) => {
        let output = '';
        stream.on('data', (chunk) => { output += chunk.toString(); });
        stream.on('end', () => resolve(output.substring(8)));
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error('Failed to exec in container:', error);
      throw new AppError('Failed to execute command', 500, 'DOCKER_ERROR');
    }
  }
}

export const dockerService = new DockerService();
export default dockerService;
