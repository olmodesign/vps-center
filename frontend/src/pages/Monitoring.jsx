import { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, MemoryStick, Clock, RefreshCw, Server } from 'lucide-react';
import api from '../api/client';

export default function Monitoring() {
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [containerStats, setContainerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/monitoring/all');
      if (response.data.success) {
        setSystemMetrics(response.data.data.system);
        setContainerStats(response.data.data.containers);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchMetrics, 5000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsageColor = (percent) => {
    const value = parseFloat(percent);
    if (value < 50) return 'text-terminal-green';
    if (value < 80) return 'text-terminal-yellow';
    return 'text-terminal-red';
  };

  const getBarColor = (percent) => {
    const value = parseFloat(percent);
    if (value < 50) return 'bg-terminal-green';
    if (value < 80) return 'bg-terminal-yellow';
    return 'bg-terminal-red';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-terminal-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-terminal-accent" />
          <h1 className="text-xl font-bold text-terminal-white">Monitoring</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-terminal-muted">
            {lastUpdate && `Updated: ${lastUpdate.toLocaleTimeString()}`}
          </span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
              autoRefresh 
                ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/30' 
                : 'bg-vps-card text-terminal-muted border border-vps-border'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto 5s' : 'Paused'}
          </button>
          <button
            onClick={fetchMetrics}
            className="p-2 text-terminal-muted hover:text-terminal-white hover:bg-vps-surface-light rounded transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* System Metrics */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CPU */}
          <div className="bg-vps-card border border-vps-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Cpu className="w-5 h-5 text-terminal-cyan" />
              <span className="text-terminal-muted text-sm">CPU</span>
            </div>
            <div className={`text-3xl font-mono font-bold ${getUsageColor(systemMetrics.cpu.usage)}`}>
              {systemMetrics.cpu.usage}%
            </div>
            <div className="mt-2 h-2 bg-vps-bg rounded-full overflow-hidden">
              <div 
                className={`h-full ${getBarColor(systemMetrics.cpu.usage)} transition-all duration-500`}
                style={{ width: `${systemMetrics.cpu.usage}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-terminal-muted">
              {systemMetrics.cpu.cores} cores • Load: {systemMetrics.cpu.loadAvg['1m']}
            </div>
          </div>

          {/* Memory */}
          <div className="bg-vps-card border border-vps-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <MemoryStick className="w-5 h-5 text-terminal-magenta" />
              <span className="text-terminal-muted text-sm">Memory</span>
            </div>
            <div className={`text-3xl font-mono font-bold ${getUsageColor(systemMetrics.memory.usagePercent)}`}>
              {systemMetrics.memory.usagePercent}%
            </div>
            <div className="mt-2 h-2 bg-vps-bg rounded-full overflow-hidden">
              <div 
                className={`h-full ${getBarColor(systemMetrics.memory.usagePercent)} transition-all duration-500`}
                style={{ width: `${systemMetrics.memory.usagePercent}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-terminal-muted">
              {formatBytes(systemMetrics.memory.used)} / {formatBytes(systemMetrics.memory.total)}
            </div>
          </div>

          {/* Disk */}
          <div className="bg-vps-card border border-vps-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <HardDrive className="w-5 h-5 text-terminal-yellow" />
              <span className="text-terminal-muted text-sm">Disk</span>
            </div>
            <div className={`text-3xl font-mono font-bold ${getUsageColor(systemMetrics.disk.usagePercent)}`}>
              {systemMetrics.disk.usagePercent}%
            </div>
            <div className="mt-2 h-2 bg-vps-bg rounded-full overflow-hidden">
              <div 
                className={`h-full ${getBarColor(systemMetrics.disk.usagePercent)} transition-all duration-500`}
                style={{ width: `${systemMetrics.disk.usagePercent}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-terminal-muted">
              {systemMetrics.disk.used} / {systemMetrics.disk.total}
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-vps-card border border-vps-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-terminal-green" />
              <span className="text-terminal-muted text-sm">Uptime</span>
            </div>
            <div className="text-3xl font-mono font-bold text-terminal-green">
              {systemMetrics.uptime.formatted}
            </div>
            <div className="mt-4 text-xs text-terminal-muted">
              System running stable
            </div>
          </div>
        </div>
      )}

      {/* Container Stats */}
      <div className="bg-vps-card border border-vps-border rounded-lg">
        <div className="p-4 border-b border-vps-border">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-terminal-cyan" />
            <h2 className="text-lg font-semibold text-terminal-white">Container Resources</h2>
            <span className="text-sm text-terminal-muted">({containerStats.length} running)</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vps-border">
                <th className="text-left py-3 px-4 text-terminal-muted text-sm font-medium">Container</th>
                <th className="text-left py-3 px-4 text-terminal-muted text-sm font-medium">CPU</th>
                <th className="text-left py-3 px-4 text-terminal-muted text-sm font-medium">Memory</th>
                <th className="text-left py-3 px-4 text-terminal-muted text-sm font-medium">Network I/O</th>
              </tr>
            </thead>
            <tbody>
              {containerStats.map((container) => (
                <tr key={container.id} className="border-b border-vps-border/50 hover:bg-vps-surface-light/50">
                  <td className="py-3 px-4">
                    <div className="font-mono text-sm text-terminal-white">{container.name}</div>
                    <div className="text-xs text-terminal-muted truncate max-w-[200px]">{container.image}</div>
                  </td>
                  <td className="py-3 px-4">
                    {container.error ? (
                      <span className="text-terminal-muted text-sm">N/A</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-sm ${getUsageColor(container.cpu)}`}>
                          {container.cpu}%
                        </span>
                        <div className="w-16 h-1.5 bg-vps-bg rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getBarColor(container.cpu)}`}
                            style={{ width: `${Math.min(parseFloat(container.cpu), 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {container.error ? (
                      <span className="text-terminal-muted text-sm">N/A</span>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-sm ${getUsageColor(container.memory.percent)}`}>
                            {container.memory.percent}%
                          </span>
                          <div className="w-16 h-1.5 bg-vps-bg rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getBarColor(container.memory.percent)}`}
                              style={{ width: `${container.memory.percent}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-terminal-muted mt-0.5">
                          {formatBytes(container.memory.usage)}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {container.error ? (
                      <span className="text-terminal-muted text-sm">N/A</span>
                    ) : (
                      <div className="text-xs font-mono">
                        <span className="text-terminal-green">↓ {formatBytes(container.network.rx)}</span>
                        <span className="text-terminal-muted mx-1">/</span>
                        <span className="text-terminal-cyan">↑ {formatBytes(container.network.tx)}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
