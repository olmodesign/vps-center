import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import docker from '../config/docker.js';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

class MonitoringService {
  // Métricas del sistema
  async getSystemMetrics() {
    try {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      // CPU usage
      const cpuUsage = await this.getCpuUsage();

      // Disk usage
      const diskUsage = await this.getDiskUsage();

      // Uptime
      const uptime = os.uptime();

      // Load average
      const loadAvg = os.loadavg();

      return {
        cpu: {
          cores: cpus.length,
          model: cpus[0]?.model || 'Unknown',
          usage: cpuUsage,
          loadAvg: {
            '1m': loadAvg[0].toFixed(2),
            '5m': loadAvg[1].toFixed(2),
            '15m': loadAvg[2].toFixed(2),
          },
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          usagePercent: ((usedMem / totalMem) * 100).toFixed(1),
        },
        disk: diskUsage,
        uptime: {
          seconds: uptime,
          formatted: this.formatUptime(uptime),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get system metrics:', error);
      throw error;
    }
  }

  // CPU usage percentage
  async getCpuUsage() {
    try {
      const { stdout } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
      return parseFloat(stdout.trim()) || 0;
    } catch {
      // Fallback method
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });
      return (100 - (totalIdle / totalTick) * 100).toFixed(1);
    }
  }

  // Disk usage
  async getDiskUsage() {
    try {
      const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $2,$3,$4,$5}'");
      const [total, used, available, percent] = stdout.trim().split(' ');
      return {
        total,
        used,
        available,
        usagePercent: parseFloat(percent) || 0,
      };
    } catch (error) {
      return { total: '0', used: '0', available: '0', usagePercent: 0 };
    }
  }

  // Container stats
  async getContainerStats() {
    try {
      const containers = await docker.listContainers({ all: false });
      const stats = await Promise.all(
        containers.map(async (containerInfo) => {
          try {
            const container = docker.getContainer(containerInfo.Id);
            const stats = await container.stats({ stream: false });
            
            // Calculate CPU percentage
            const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
            const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
            const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100 : 0;

            // Calculate memory
            const memUsage = stats.memory_stats.usage || 0;
            const memLimit = stats.memory_stats.limit || 1;
            const memPercent = (memUsage / memLimit) * 100;

            // Network I/O
            let netRx = 0;
            let netTx = 0;
            if (stats.networks) {
              Object.values(stats.networks).forEach(net => {
                netRx += net.rx_bytes || 0;
                netTx += net.tx_bytes || 0;
              });
            }

            return {
              id: containerInfo.Id.substring(0, 12),
              name: containerInfo.Names[0].replace('/', ''),
              image: containerInfo.Image,
              state: containerInfo.State,
              cpu: cpuPercent.toFixed(2),
              memory: {
                usage: memUsage,
                limit: memLimit,
                percent: memPercent.toFixed(2),
              },
              network: {
                rx: netRx,
                tx: netTx,
              },
            };
          } catch (err) {
            return {
              id: containerInfo.Id.substring(0, 12),
              name: containerInfo.Names[0].replace('/', ''),
              error: 'Stats unavailable',
            };
          }
        })
      );

      return stats;
    } catch (error) {
      logger.error('Failed to get container stats:', error);
      throw error;
    }
  }

  // Format bytes
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }

  // Format uptime
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ') || '0m';
  }
}

export const monitoringService = new MonitoringService();
export default monitoringService;
