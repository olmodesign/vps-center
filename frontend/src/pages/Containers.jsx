import { useState, useEffect } from 'react';
import { 
  Container, Search, RefreshCw, Play, Square, RotateCcw,
  AlertCircle, X, FileText, Cpu, HardDrive, Clock, MoreVertical
} from 'lucide-react';
import { containersApi } from '../api/client';

function StatusBadge({ status }) {
  const config = {
    running: 'bg-terminal-green/20 text-terminal-green border-terminal-green/30',
    exited: 'bg-terminal-red/20 text-terminal-red border-terminal-red/30',
    paused: 'bg-terminal-yellow/20 text-terminal-yellow border-terminal-yellow/30',
    restarting: 'bg-terminal-cyan/20 text-terminal-cyan border-terminal-cyan/30',
    created: 'bg-terminal-gray/20 text-terminal-gray border-terminal-gray/30',
  };
  return <span className={`inline-flex items-center px-2 py-1 text-xs font-mono rounded border ${config[status] || config.created}`}>{status}</span>;
}

function Modal({ isOpen, onClose, title, children, wide }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={`relative bg-vps-surface border border-vps-border rounded-lg w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="bg-vps-surface border-b border-vps-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-mono font-semibold text-terminal-white">{title}</h2>
          <button onClick={onClose} className="text-terminal-gray hover:text-terminal-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function Containers() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [logsModal, setLogsModal] = useState(null);
  const [logs, setLogs] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchContainers = async () => {
    try {
      setLoading(true);
      const res = await containersApi.getAll();
      setContainers(res.data?.data || []);
    } catch (err) {
      setError('Failed to load containers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContainers(); }, []);

  const handleAction = async (id, action) => {
    try {
      setActionLoading(`${id}-${action}`);
      setError(null);
      await containersApi[action](id);
      await fetchContainers();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} container`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewLogs = async (container) => {
    setLogsModal(container);
    setLogsLoading(true);
    try {
      const res = await containersApi.getLogs(container.id);
      setLogs(res.data?.data || 'No logs available');
    } catch (err) {
      setLogs('Failed to fetch logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const filteredContainers = containers.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
                          c.image?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || c.state === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: containers.length,
    running: containers.filter(c => c.state === 'running').length,
    stopped: containers.filter(c => c.state === 'exited').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-terminal-white">Containers</h1>
          <p className="text-terminal-gray mt-1">Manage Docker containers</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="text-terminal-gray">Total: <span className="text-terminal-white">{stats.total}</span></span>
          <span className="text-terminal-gray">|</span>
          <span className="text-terminal-green">{stats.running} running</span>
          <span className="text-terminal-gray">|</span>
          <span className="text-terminal-red">{stats.stopped} stopped</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-terminal-red/10 border border-terminal-red/30 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-terminal-red" />
          <p className="text-sm text-terminal-red">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-terminal-red hover:text-terminal-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-gray" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search containers..." className="input pl-10 font-mono" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input font-mono w-full sm:w-40">
          <option value="all">All Status</option>
          <option value="running">Running</option>
          <option value="exited">Stopped</option>
          <option value="paused">Paused</option>
        </select>
        <button onClick={fetchContainers} className="btn-ghost"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-vps-surface border border-vps-border rounded-lg animate-pulse" />)}
        </div>
      ) : filteredContainers.length > 0 ? (
        <div className="space-y-3">
          {filteredContainers.map((container) => (
            <div key={container.id} className="card border border-vps-border hover:border-terminal-green/30 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    container.state === 'running' 
                      ? 'bg-terminal-green/10 border-terminal-green/30' 
                      : 'bg-terminal-gray/10 border-terminal-gray/30'
                  }`}>
                    <Container className={`w-5 h-5 ${container.state === 'running' ? 'text-terminal-green' : 'text-terminal-gray'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-terminal-white truncate">{container.name?.replace(/^\//, '') || 'unnamed'}</h3>
                      <StatusBadge status={container.state} />
                    </div>
                    <p className="text-sm text-terminal-gray font-mono truncate">{container.image || 'unknown image'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-terminal-gray font-mono">
                  {container.ports?.length > 0 && (
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {container.ports.slice(0, 2).map((p, i) => (
                        <span key={i}>{p.PublicPort || p.PrivatePort}</span>
                      ))}
                      {container.ports.length > 2 && <span>+{container.ports.length - 2}</span>}
                    </span>
                  )}
                  <span className="flex items-center gap-1 hidden sm:flex">
                    <Clock className="w-3 h-3" />
                    {container.status || 'unknown'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {container.state === 'running' ? (
                    <button 
                      onClick={() => handleAction(container.id, 'stop')} 
                      disabled={actionLoading === `${container.id}-stop`}
                      className="btn-ghost text-terminal-red hover:bg-terminal-red/10"
                    >
                      {actionLoading === `${container.id}-stop` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                      <span className="hidden sm:inline">Stop</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleAction(container.id, 'start')} 
                      disabled={actionLoading === `${container.id}-start`}
                      className="btn-ghost text-terminal-green hover:bg-terminal-green/10"
                    >
                      {actionLoading === `${container.id}-start` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      <span className="hidden sm:inline">Start</span>
                    </button>
                  )}
                  <button 
                    onClick={() => handleAction(container.id, 'restart')} 
                    disabled={actionLoading === `${container.id}-restart`}
                    className="btn-ghost text-terminal-yellow hover:bg-terminal-yellow/10"
                  >
                    {actionLoading === `${container.id}-restart` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    <span className="hidden sm:inline">Restart</span>
                  </button>
                  <button onClick={() => handleViewLogs(container)} className="btn-ghost">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Logs</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card border border-vps-border text-center py-12">
          <Container className="w-12 h-12 mx-auto text-terminal-gray mb-4" />
          <h3 className="text-lg font-medium text-terminal-white mb-2">{search || filter !== 'all' ? 'No containers found' : 'No containers'}</h3>
          <p className="text-terminal-gray">{search || filter !== 'all' ? 'Try different filters' : 'No Docker containers detected on this system'}</p>
        </div>
      )}

      <Modal isOpen={!!logsModal} onClose={() => { setLogsModal(null); setLogs(''); }} title={`Logs: ${logsModal?.name?.replace(/^\//, '')}`} wide>
        {logsLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-terminal-cyan animate-spin" />
          </div>
        ) : (
          <pre className="bg-vps-bg p-4 rounded-md text-xs text-terminal-gray font-mono overflow-x-auto max-h-96 whitespace-pre-wrap">{logs}</pre>
        )}
      </Modal>
    </div>
  );
}

export default Containers;
