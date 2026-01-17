import { useState, useEffect } from 'react';
import { 
  FolderKanban, Container, Network, HardDrive, Cpu, MemoryStick,
  AlertTriangle, ArrowUpRight, RefreshCw, Play, Square, Pause
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { containersApi } from '../api/client';

function StatCard({ icon: Icon, label, value, subValue, color = 'green', loading }) {
  const colors = {
    green: 'text-terminal-green border-terminal-green/30 bg-terminal-green/5',
    cyan: 'text-terminal-cyan border-terminal-cyan/30 bg-terminal-cyan/5',
    yellow: 'text-terminal-yellow border-terminal-yellow/30 bg-terminal-yellow/5',
    red: 'text-terminal-red border-terminal-red/30 bg-terminal-red/5',
  };

  return (
    <div className={`card border border-vps-border ${loading ? 'animate-pulse' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-md border ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {subValue && <span className="text-xs text-terminal-gray font-mono">{subValue}</span>}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold font-mono text-terminal-white">{loading ? '---' : value}</p>
        <p className="text-sm text-terminal-gray mt-1">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    running: { color: 'bg-terminal-green/20 text-terminal-green border-terminal-green/30', icon: Play },
    active: { color: 'bg-terminal-green/20 text-terminal-green border-terminal-green/30', icon: Play },
    exited: { color: 'bg-terminal-red/20 text-terminal-red border-terminal-red/30', icon: Square },
    inactive: { color: 'bg-terminal-red/20 text-terminal-red border-terminal-red/30', icon: Square },
    paused: { color: 'bg-terminal-yellow/20 text-terminal-yellow border-terminal-yellow/30', icon: Pause },
  };
  const config = statusConfig[status] || statusConfig.inactive;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({ projects: 0, containers: { total: 0, running: 0 }, ports: 0 });
  const [detectedProjects, setDetectedProjects] = useState([]);
  const [recentContainers, setRecentContainers] = useState([]);
  const [allPorts, setAllPorts] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Detectar proyectos automáticamente
      const projectsRes = await containersApi.detectProjects();
      const projects = projectsRes.data?.data || [];
      setDetectedProjects(projects);
      
      // Obtener contenedores
      const containersRes = await containersApi.getAll();
      const containers = containersRes.data?.data || [];
      const runningContainers = containers.filter(c => c.state === 'running').length;
      setRecentContainers(containers.slice(0, 5));
      
      // Obtener puertos
      const portsRes = await containersApi.getAllPorts();
      const ports = portsRes.data?.data || [];
      setAllPorts(ports);
      
      // Stats
      setStats({
        projects: projects.length,
        containers: { total: containers.length, running: runningContainers },
        ports: ports.filter(p => p.public).length,
      });

      // System info
      try {
        const systemRes = await containersApi.getSystemInfo();
        setSystemStats(systemRes.data?.data || null);
      } catch (e) {
        console.log('System stats not available');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-terminal-white">Dashboard</h1>
          <p className="text-terminal-gray mt-1">System overview and quick stats</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="btn-ghost">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Detected Projects" value={stats.projects} color="cyan" loading={loading} />
        <StatCard icon={Container} label="Containers" value={stats.containers.total} subValue={`${stats.containers.running} running`} color="green" loading={loading} />
        <StatCard icon={Network} label="Public Ports" value={stats.ports} color="yellow" loading={loading} />
        <StatCard icon={HardDrive} label="System Status" value={systemStats ? 'Online' : 'Unknown'} color={systemStats ? 'green' : 'yellow'} loading={loading} />
      </div>

      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card border border-vps-border">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-terminal-cyan" />
              <span className="text-sm text-terminal-gray">CPUs</span>
            </div>
            <p className="text-2xl font-bold font-mono text-terminal-cyan">{systemStats.cpus || 0}</p>
          </div>
          <div className="card border border-vps-border">
            <div className="flex items-center gap-2 mb-3">
              <MemoryStick className="w-4 h-4 text-terminal-green" />
              <span className="text-sm text-terminal-gray">Memory</span>
            </div>
            <p className="text-2xl font-bold font-mono text-terminal-green">{((systemStats.memoryTotal || 0) / 1024 / 1024 / 1024).toFixed(1)} GB</p>
          </div>
          <div className="card border border-vps-border">
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="w-4 h-4 text-terminal-yellow" />
              <span className="text-sm text-terminal-gray">Docker Version</span>
            </div>
            <p className="text-2xl font-bold font-mono text-terminal-yellow">{systemStats.dockerVersion || 'N/A'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detected Projects */}
        <div className="card border border-vps-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-mono font-semibold text-terminal-white">Detected Projects</h2>
            <Link to="/projects" className="text-terminal-cyan hover:text-terminal-green text-sm flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-vps-surface-light rounded animate-pulse" />)}
            </div>
          ) : detectedProjects.length > 0 ? (
            <div className="space-y-2">
              {detectedProjects.slice(0, 5).map((project, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-vps-surface-light rounded-md hover:bg-vps-border/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-terminal-cyan/10 border border-terminal-cyan/30 rounded flex items-center justify-center">
                      <FolderKanban className="w-4 h-4 text-terminal-cyan" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-terminal-white">{project.name}</p>
                      <p className="text-xs text-terminal-gray font-mono">{project.containers.length} containers • {project.ports.length} ports</p>
                    </div>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-terminal-gray">
              <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No projects detected</p>
            </div>
          )}
        </div>

        {/* Containers */}
        <div className="card border border-vps-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-mono font-semibold text-terminal-white">Containers</h2>
            <Link to="/containers" className="text-terminal-cyan hover:text-terminal-green text-sm flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-vps-surface-light rounded animate-pulse" />)}
            </div>
          ) : recentContainers.length > 0 ? (
            <div className="space-y-2">
              {recentContainers.map((container) => (
                <div key={container.id} className="flex items-center justify-between p-3 bg-vps-surface-light rounded-md hover:bg-vps-border/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-terminal-green/10 border border-terminal-green/30 rounded flex items-center justify-center">
                      <Container className="w-4 h-4 text-terminal-green" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-terminal-white truncate max-w-[200px]">{container.name || 'unnamed'}</p>
                      <p className="text-xs text-terminal-gray font-mono truncate max-w-[200px]">{(container.image || 'unknown').split(':')[0]}</p>
                    </div>
                  </div>
                  <StatusBadge status={container.state} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-terminal-gray">
              <Container className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No containers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Ports Table */}
      <div className="card border border-vps-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono font-semibold text-terminal-white">Port Allocation</h2>
          <span className="text-xs text-terminal-gray font-mono">{allPorts.filter(p => p.public).length} public ports</span>
        </div>
        {loading ? (
          <div className="h-32 bg-vps-surface-light rounded animate-pulse" />
        ) : allPorts.filter(p => p.public).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-vps-border">
                  <th className="text-left py-2 px-3 text-terminal-gray font-mono">Public</th>
                  <th className="text-left py-2 px-3 text-terminal-gray font-mono">Private</th>
                  <th className="text-left py-2 px-3 text-terminal-gray font-mono">Type</th>
                  <th className="text-left py-2 px-3 text-terminal-gray font-mono">Container</th>
                </tr>
              </thead>
              <tbody>
                {allPorts.filter(p => p.public).slice(0, 10).map((port, i) => (
                  <tr key={i} className="border-b border-vps-border/50 hover:bg-vps-surface-light">
                    <td className="py-2 px-3 font-mono text-terminal-cyan">{port.public}</td>
                    <td className="py-2 px-3 font-mono text-terminal-gray">{port.private}</td>
                    <td className="py-2 px-3 font-mono text-terminal-gray">{port.type}</td>
                    <td className="py-2 px-3 text-terminal-green">{port.container}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-terminal-gray">
            <Network className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No public ports exposed</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card border border-vps-border">
        <h2 className="text-lg font-mono font-semibold text-terminal-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/projects" className="p-4 bg-vps-surface-light hover:bg-vps-border/50 rounded-md border border-vps-border hover:border-terminal-cyan transition-all group">
            <FolderKanban className="w-6 h-6 text-terminal-cyan mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-terminal-white">Projects</p>
            <p className="text-xs text-terminal-gray">View detected</p>
          </Link>
          <Link to="/containers" className="p-4 bg-vps-surface-light hover:bg-vps-border/50 rounded-md border border-vps-border hover:border-terminal-green transition-all group">
            <Container className="w-6 h-6 text-terminal-green mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-terminal-white">Containers</p>
            <p className="text-xs text-terminal-gray">Manage Docker</p>
          </Link>
          <Link to="/settings" className="p-4 bg-vps-surface-light hover:bg-vps-border/50 rounded-md border border-vps-border hover:border-terminal-yellow transition-all group">
            <Network className="w-6 h-6 text-terminal-yellow mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-terminal-white">Ports Map</p>
            <p className="text-xs text-terminal-gray">View allocation</p>
          </Link>
          <Link to="/settings" className="p-4 bg-vps-surface-light hover:bg-vps-border/50 rounded-md border border-vps-border hover:border-terminal-red transition-all group">
            <AlertTriangle className="w-6 h-6 text-terminal-red mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-terminal-white">Alerts</p>
            <p className="text-xs text-terminal-gray">Configure alerts</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
