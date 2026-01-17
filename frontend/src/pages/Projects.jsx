import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, Search, RefreshCw, Container, Network,
  ArrowUpRight, Play, Square, Database
} from 'lucide-react';
import { containersApi } from '../api/client';

function StatusBadge({ status }) {
  const config = {
    active: 'bg-terminal-green/20 text-terminal-green border-terminal-green/30',
    inactive: 'bg-terminal-red/20 text-terminal-red border-terminal-red/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded border ${config[status] || config.inactive}`}>
      {status === 'active' ? <Play className="w-3 h-3" /> : <Square className="w-3 h-3" />}
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
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono rounded border ${colors[tech] || 'bg-terminal-gray/20 text-terminal-gray border-terminal-gray/30'}`}>
      {tech}
    </span>
  );
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await containersApi.detectProjects();
      setProjects(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const filteredProjects = projects.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.stack?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    inactive: projects.filter(p => p.status === 'inactive').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-terminal-white">Projects</h1>
          <p className="text-terminal-gray mt-1">Auto-detected from Docker containers</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="text-terminal-gray">Total: <span className="text-terminal-white">{stats.total}</span></span>
          <span className="text-terminal-gray">|</span>
          <span className="text-terminal-green">{stats.active} active</span>
          <span className="text-terminal-gray">|</span>
          <span className="text-terminal-red">{stats.inactive} inactive</span>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-gray" />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search projects or technologies..." 
            className="input pl-10 font-mono" 
          />
        </div>
        <button onClick={fetchProjects} className="btn-ghost">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-vps-surface border border-vps-border rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project, idx) => (
            <Link
              key={idx}
              to={`/projects/${encodeURIComponent(project.name)}`}
              className="card border border-vps-border hover:border-terminal-cyan/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-terminal-cyan/10 border border-terminal-cyan/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FolderKanban className="w-5 h-5 text-terminal-cyan" />
                </div>
                <StatusBadge status={project.status} />
              </div>
              
              <h3 className="text-lg font-semibold text-terminal-white mb-2 group-hover:text-terminal-cyan transition-colors">
                {project.name}
              </h3>
              
              {/* Stack badges */}
              {project.stack?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.stack.slice(0, 4).map((tech, i) => (
                    <TechBadge key={i} tech={tech} />
                  ))}
                  {project.stack.length > 4 && (
                    <span className="text-xs text-terminal-gray">+{project.stack.length - 4}</span>
                  )}
                </div>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-terminal-gray">
                <span className="flex items-center gap-1">
                  <Container className="w-3 h-3" />
                  {project.containers?.length || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Network className="w-3 h-3" />
                  {project.ports?.length || 0}
                </span>
                {project.stack?.some(t => ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'].includes(t)) && (
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    DB
                  </span>
                )}
              </div>
              
              {/* View link */}
              <div className="mt-4 pt-3 border-t border-vps-border flex items-center justify-between">
                <span className="text-xs text-terminal-gray">Click to view details</span>
                <ArrowUpRight className="w-4 h-4 text-terminal-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card border border-vps-border text-center py-12">
          <FolderKanban className="w-12 h-12 mx-auto text-terminal-gray mb-4" />
          <h3 className="text-lg font-medium text-terminal-white mb-2">
            {search ? 'No projects found' : 'No projects detected'}
          </h3>
          <p className="text-terminal-gray">
            {search ? 'Try a different search term' : 'No Docker containers detected on this system'}
          </p>
        </div>
      )}
    </div>
  );
}

export default Projects;
