import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Container, Settings, LogOut, Terminal, Menu, Activity, Network } from 'lucide-react';
import useAuthStore from '../../hooks/useAuth';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/containers', icon: Container, label: 'Containers' },
  { path: '/monitoring', icon: Activity, label: 'Monitoring' },
  { path: '/traefik', icon: Network, label: 'Traefik' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-vps-bg flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      
      <aside className={'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-vps-surface border-r border-vps-border transform transition-transform duration-200 ' + (sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-vps-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-vps-bg border border-terminal-green/50 rounded-md flex items-center justify-center">
                <Terminal className="w-5 h-5 text-terminal-green" />
              </div>
              <div>
                <h1 className="font-mono font-bold text-terminal-green text-lg leading-none">VPS</h1>
                <span className="font-mono text-xs text-terminal-cyan">CENTER</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(function(item) {
              var Icon = item.icon;
              return (
                <NavLink key={item.path} to={item.path} end={item.exact} onClick={function() { setSidebarOpen(false); }}
                  className={function(props) { return 'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ' + 
                    (props.isActive ? 'bg-terminal-green/10 text-terminal-green border border-terminal-green/30' : 'text-terminal-gray hover:text-terminal-white hover:bg-vps-surface-light'); }}>
                  <Icon className="w-5 h-5" /><span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-vps-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-md bg-terminal-cyan/20 border border-terminal-cyan/30 flex items-center justify-center">
                <span className="text-terminal-cyan font-mono font-bold text-sm">{user?.email?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-terminal-white truncate">{user?.email}</p>
                <p className="text-xs text-terminal-gray capitalize">{user?.role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-terminal-gray hover:text-terminal-red hover:bg-terminal-red/10 transition-all">
              <LogOut className="w-4 h-4" /><span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-vps-surface border-b border-vps-border p-4">
          <div className="flex items-center gap-4">
            <button onClick={function() { setSidebarOpen(true); }} className="p-2 text-terminal-gray hover:text-terminal-white hover:bg-vps-surface-light rounded-md">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-terminal-green" />
              <span className="font-mono font-bold text-terminal-green">VPS</span>
              <span className="font-mono text-xs text-terminal-cyan">CENTER</span>
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 lg:p-6 overflow-auto"><Outlet /></div>
      </main>
    </div>
  );
}

export default MainLayout;
