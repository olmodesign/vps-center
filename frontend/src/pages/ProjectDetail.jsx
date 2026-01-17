import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FolderKanban, Container, Network, Database, Globe,
  FileText, Play, Square, RotateCcw, RefreshCw, ExternalLink, HardDrive,
  Search, Download, Trash2, AlertCircle, X,
  ChevronDown, ChevronUp, Copy, Terminal
} from 'lucide-react';
import { containersApi } from '../api/client';

function StatusBadge({ status }) {
  const config = {
    running: 'bg-terminal-green/20 text-terminal-green border-terminal-green/30',
    active: 'bg-terminal-green/20 text-terminal-green border-terminal-green/30',
    exited: 'bg-terminal-red/20 text-terminal-red border-terminal-red/30',
    inactive: 'bg-terminal-red/20 text-terminal-red border-terminal-red/30',
    paused: 'bg-terminal-yellow/20 text-terminal-yellow border-terminal-yellow/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded border ${config[status] || config.inactive}`}>
      {status === 'running' || status === 'active' ? <Play className="w-3 h-3" /> : <Square className="w-3 h-3" />}
      {status}
    </span>
  );
}

function TechBadge({ tech }) {
  const colors = {
    'Node.js': 'bg-green-500/20 text-green-400 border-green-500/30',
    'PostgreSQL': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'MySQL': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'MongoDB': 'bg-green-600/20 text-green-500 border-green-600/30',
    'Redis': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Nginx': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Traefik': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Python': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'n8n': 'bg-orange-400/20 text-orange-300 border-orange-400/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-mono rounded border ${colors[tech] || 'bg-terminal-gray/20 text-terminal-gray border-terminal-gray/30'}`}>
      {tech}
    </span>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true, count }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="card border border-vps-border">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-terminal-cyan" />
          <h2 className="text-lg font-mono font-semibold text-terminal-white">{title}</h2>
          {count !== undefined && <span className="text-xs text-terminal-gray font-mono">({count})</span>}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-terminal-gray" /> : <ChevronDown className="w-4 h-4 text-terminal-gray" />}
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
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

function ProjectDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [dbTables, setDbTables] = useState({});
  const [dbSizes, setDbSizes] = useState({});
  const [queryModal, setQueryModal] = useState(null);
  const [queryText, setQueryText] = useState('SELECT * FROM ');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(null);
  const [logsModal, setLogsModal] = useState(null);
  const [logs, setLogs] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await containersApi.getProjectDetail(name);
      setProject(res.data?.data);
      const backupsRes = await containersApi.listBackups(name);
      setBackups(backupsRes.data?.data || []);
      const dbData = res.data?.data?.databases || [];
      for (const db of dbData) {
        try {
          const tablesRes = await containersApi.getDatabaseTables(db.containerId, db.database, db.user);
          setDbTables(prev => ({ ...prev, [db.containerId]: tablesRes.data?.data || [] }));
          const sizeRes = await containersApi.getDatabaseSize(db.containerId, db.database, db.user);
          setDbSizes(prev => ({ ...prev, [db.containerId]: sizeRes.data?.data?.size || 'Unknown' }));
        } catch (e) { console.error('Failed to fetch DB info:', e); }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [name]);

  const handleContainerAction = async (containerId, action) => {
    try {
      setActionLoading(`${containerId}-${action}`);
      await containersApi[action](containerId);
      await fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} container`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleProjectAction = async (action) => {
    try {
      setActionLoading(`project-${action}`);
      await containersApi[`${action}Project`](name);
      await fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} project`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewLogs = async (container) => {
    setLogsModal(container);
    setLogsLoading(true);
    try {
      const res = await containersApi.getLogs(container.id, { tail: 200 });
      setLogs(res.data?.data?.join('\n') || 'No logs available');
    } catch (err) {
      setLogs('Failed to fetch logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!queryModal || !queryText.trim()) return;
    try {
      setQueryLoading(true);
      const res = await containersApi.queryDatabase(queryModal.containerId, {
        database: queryModal.database,
        user: queryModal.user,
        query: queryText,
      });
      setQueryResult(res.data?.data);
    } catch (err) {
      setQueryResult({ error: err.response?.data?.message || 'Query failed' });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleBackup = async (db) => {
    try {
      setBackupLoading(db.containerId);
      await containersApi.backupDatabase(db.containerId, { database: db.database, user: db.user });
      const backupsRes = await containersApi.listBackups(name);
      setBackups(backupsRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Backup failed');
    } finally {
      setBackupLoading(null);
    }
  };

  const handleDownloadBackup = async (filename) => {
    try {
      const res = await containersApi.downloadBackup(filename);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download backup');
    }
  };

  const handleDeleteBackup = async (filename) => {
    if (!confirm('Delete this backup?')) return;
    try {
      await containersApi.deleteBackup(filename);
      setBackups(backups.filter(b => b.filename !== filename));
    } catch (err) {
      setError('Failed to delete backup');
    }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-terminal-cyan animate-spin" /></div>;
  }

  if (error && !project) {
    return (
      <div className="card border border-terminal-red/30 bg-terminal-red/10 text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-terminal-red mb-4" />
        <p className="text-terminal-red mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-ghost"><ArrowLeft className="w-4 h-4" /> Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-terminal-red/10 border border-terminal-red/30 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-terminal-red" />
          <p className="text-sm text-terminal-red flex-1">{error}</p>
          <button onClick={() => setError(null)}><X className="w-4 h-4 text-terminal-red" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-terminal-cyan/10 border border-terminal-cyan/30 rounded-lg flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-terminal-cyan" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-mono text-terminal-white">{project?.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={project?.status} />
                  <span className="text-terminal-gray text-sm">{project?.containers?.length || 0} containers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button onClick={fetchProject} className="btn-ghost"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      {/* Stack */}
      {project?.stack?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.stack.map((tech, i) => <TechBadge key={i} tech={tech} />)}
        </div>
      )}

      {/* APIs & URLs */}
      {project?.apis?.length > 0 && (
        <Section title="APIs & URLs" icon={Globe} count={project.apis.length}>
          <div className="space-y-3">
            {project.apis.map((api, i) => (
              <div key={i} className="p-4 bg-vps-surface-light rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-terminal-cyan" />
                    <span className="font-mono font-medium text-terminal-white">{api.container}</span>
                    {api.type === 'frontend' && (
                      <span className="text-xs bg-terminal-green/20 text-terminal-green px-2 py-0.5 rounded">Frontend</span>
                    )}
                    {!api.type && (
                      <span className="text-xs bg-terminal-cyan/20 text-terminal-cyan px-2 py-0.5 rounded">API</span>
                    )}
                  </div>
                </div>
                {api.domain ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-terminal-gray">URL:</span>
                      <a href={api.url} target="_blank" rel="noopener noreferrer" className="text-terminal-cyan hover:underline flex items-center gap-1">
                        {api.url} <ExternalLink className="w-3 h-3" />
                      </a>
                      <button onClick={() => copyToClipboard(api.url)} className="text-terminal-gray hover:text-terminal-white">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    {api.docsUrl && api.type !== 'frontend' && (
                      <div className="flex items-center gap-2">
                        <span className="text-terminal-gray">Docs:</span>
                        <a href={api.docsUrl} target="_blank" rel="noopener noreferrer" className="text-terminal-yellow hover:underline flex items-center gap-1">
                          {api.docsUrl} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-terminal-gray">No public domain configured (internal only)</p>
                )}
                {api.privatePort && (
                  <p className="text-xs text-terminal-gray mt-2">Internal port: {api.privatePort}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Containers */}
      <Section title="Containers" icon={Container} count={project?.containers?.length}>
        <div className="space-y-2">
          {project?.containers?.map((container) => (
            <div key={container.id} className="flex items-center justify-between p-3 bg-vps-surface-light rounded-md">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center border ${container.state === 'running' ? 'bg-terminal-green/10 border-terminal-green/30' : 'bg-terminal-gray/10 border-terminal-gray/30'}`}>
                  <Container className={`w-4 h-4 ${container.state === 'running' ? 'text-terminal-green' : 'text-terminal-gray'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-terminal-white">{container.name}</p>
                  <p className="text-xs text-terminal-gray font-mono">{container.image}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={container.state} />
                {container.state === 'running' ? (
                  <button onClick={() => handleContainerAction(container.id, 'stop')} disabled={actionLoading === `${container.id}-stop`} className="btn-ghost text-terminal-red hover:bg-terminal-red/10 p-2">
                    {actionLoading === `${container.id}-stop` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                  </button>
                ) : (
                  <button onClick={() => handleContainerAction(container.id, 'start')} disabled={actionLoading === `${container.id}-start`} className="btn-ghost text-terminal-green hover:bg-terminal-green/10 p-2">
                    {actionLoading === `${container.id}-start` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
                <button onClick={() => handleContainerAction(container.id, 'restart')} disabled={actionLoading === `${container.id}-restart`} className="btn-ghost text-terminal-yellow hover:bg-terminal-yellow/10 p-2">
                  {actionLoading === `${container.id}-restart` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                </button>
                <button onClick={() => handleViewLogs(container)} className="btn-ghost p-2"><FileText className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Ports */}
      <Section title="Ports" icon={Network} count={project?.allPorts?.length}>
        {project?.allPorts?.length > 0 ? (
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
                {project.allPorts.map((port, i) => (
                  <tr key={i} className="border-b border-vps-border/50 hover:bg-vps-surface-light">
                    <td className="py-2 px-3 font-mono text-terminal-cyan">{port.public || '-'}</td>
                    <td className="py-2 px-3 font-mono text-terminal-gray">{port.private}</td>
                    <td className="py-2 px-3 font-mono text-terminal-gray">{port.type}</td>
                    <td className="py-2 px-3 text-terminal-green">{port.container}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-terminal-gray text-sm">No ports configured</p>
        )}
      </Section>

      {/* Databases */}
      {project?.databases?.length > 0 && (
        <Section title="Databases" icon={Database} count={project.databases.length}>
          <div className="space-y-4">
            {project.databases.map((db, i) => (
              <div key={i} className="p-4 bg-vps-surface-light rounded-md">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-terminal-cyan" />
                      <span className="font-mono font-medium text-terminal-white">{db.type} {db.version}</span>
                    </div>
                    <p className="text-xs text-terminal-gray mt-1">Container: {db.container}</p>
                  </div>
                  <span className="text-sm font-mono text-terminal-yellow">{dbSizes[db.containerId] || 'Loading...'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-terminal-gray">Host:</span>
                    <code className="text-terminal-cyan">{db.host}:{db.port}</code>
                    <button onClick={() => copyToClipboard(`${db.host}:${db.port}`)} className="text-terminal-gray hover:text-terminal-white"><Copy className="w-3 h-3" /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-terminal-gray">Database:</span>
                    <code className="text-terminal-cyan">{db.database || 'N/A'}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-terminal-gray">User:</span>
                    <code className="text-terminal-cyan">{db.user || 'N/A'}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-terminal-gray">Tables:</span>
                    <code className="text-terminal-cyan">{dbTables[db.containerId]?.length || 0}</code>
                  </div>
                </div>
                {dbTables[db.containerId]?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-terminal-gray mb-2">Tables:</p>
                    <div className="flex flex-wrap gap-1">
                      {dbTables[db.containerId].map((table, j) => (
                        <span key={j} className="text-xs bg-vps-bg px-2 py-1 rounded font-mono text-terminal-gray">{table}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setQueryModal(db); setQueryResult(null); }} className="btn-ghost text-sm"><Search className="w-3 h-3" /> Query</button>
                  <button onClick={() => handleBackup(db)} disabled={backupLoading === db.containerId} className="btn-ghost text-sm">
                    {backupLoading === db.containerId ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Backup
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Backups */}
      <Section title="Backups" icon={HardDrive} count={backups.length} defaultOpen={false}>
        {backups.length > 0 ? (
          <div className="space-y-2">
            {backups.map((backup, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-vps-surface-light rounded-md">
                <div>
                  <p className="text-sm font-mono text-terminal-white">{backup.filename}</p>
                  <p className="text-xs text-terminal-gray">{new Date(backup.createdAt).toLocaleString()} • {(backup.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDownloadBackup(backup.filename)} className="btn-ghost p-2"><Download className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteBackup(backup.filename)} className="btn-ghost p-2 text-terminal-red hover:bg-terminal-red/10"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-terminal-gray text-sm">No backups yet</p>
        )}
      </Section>

      {/* Networks & Volumes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Networks" icon={Network} count={project?.networks?.length} defaultOpen={false}>
          {project?.networks?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {project.networks.map((net, i) => (
                <span key={i} className="text-xs bg-vps-bg px-3 py-1.5 rounded font-mono text-terminal-cyan border border-vps-border">{net}</span>
              ))}
            </div>
          ) : (
            <p className="text-terminal-gray text-sm">No networks</p>
          )}
        </Section>
        <Section title="Volumes" icon={HardDrive} count={project?.volumes?.length} defaultOpen={false}>
          {project?.volumes?.length > 0 ? (
            <div className="space-y-2">
              {project.volumes.map((vol, i) => (
                <div key={i} className="text-xs p-2 bg-vps-bg rounded font-mono">
                  <p className="text-terminal-cyan truncate">{vol.source}</p>
                  <p className="text-terminal-gray">→ {vol.destination}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-terminal-gray text-sm">No volumes</p>
          )}
        </Section>
      </div>

      {/* Project Actions */}
      <Section title="Project Actions" icon={Terminal} defaultOpen={false}>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => handleProjectAction('restart')} disabled={actionLoading === 'project-restart'} className="btn-ghost text-terminal-yellow hover:bg-terminal-yellow/10">
            {actionLoading === 'project-restart' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Restart All
          </button>
          <button onClick={() => handleProjectAction('stop')} disabled={actionLoading === 'project-stop'} className="btn-ghost text-terminal-red hover:bg-terminal-red/10">
            {actionLoading === 'project-stop' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />} Stop All
          </button>
          <button onClick={() => handleProjectAction('start')} disabled={actionLoading === 'project-start'} className="btn-ghost text-terminal-green hover:bg-terminal-green/10">
            {actionLoading === 'project-start' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Start All
          </button>
        </div>
      </Section>

      {/* Query Modal */}
      <Modal isOpen={!!queryModal} onClose={() => setQueryModal(null)} title={`Query: ${queryModal?.database}`} wide>
        <div className="space-y-4">
          <div>
            <label className="label font-mono"><span className="text-terminal-cyan">$</span> SELECT query</label>
            <textarea value={queryText} onChange={(e) => setQueryText(e.target.value)} className="input font-mono text-sm" rows={4} placeholder="SELECT * FROM users LIMIT 10" />
            <p className="text-xs text-terminal-gray mt-1">Only SELECT queries allowed</p>
          </div>
          <button onClick={handleQuery} disabled={queryLoading} className="btn-primary">
            {queryLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Execute
          </button>
          {queryResult && (
            <div className="mt-4">
              {queryResult.error ? (
                <div className="p-3 bg-terminal-red/10 border border-terminal-red/30 rounded text-terminal-red text-sm">{queryResult.error}</div>
              ) : (
                <div>
                  <p className="text-xs text-terminal-gray mb-2">{queryResult.rowCount} rows</p>
                  <pre className="bg-vps-bg p-3 rounded text-xs font-mono text-terminal-gray overflow-x-auto max-h-64">{queryResult.data?.join('\n') || 'No results'}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Logs Modal */}
      <Modal isOpen={!!logsModal} onClose={() => { setLogsModal(null); setLogs(''); }} title={`Logs: ${logsModal?.name}`} wide>
        {logsLoading ? (
          <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 text-terminal-cyan animate-spin" /></div>
        ) : (
          <pre className="bg-vps-bg p-4 rounded text-xs text-terminal-gray font-mono overflow-x-auto max-h-96 whitespace-pre-wrap">{logs}</pre>
        )}
      </Modal>
    </div>
  );
}

export default ProjectDetail;
