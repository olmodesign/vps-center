import { useState } from 'react';
import TerminalView from '../components/terminal/TerminalView';
import { Terminal as TerminalIcon, History } from 'lucide-react';

export default function Terminal() {
  const [activeTab, setActiveTab] = useState('terminal');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-6 h-6 text-terminal-accent" />
          <h1 className="text-xl font-bold text-terminal-white">Terminal</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              activeTab === 'terminal'
                ? 'bg-terminal-accent text-vps-bg'
                : 'text-terminal-muted hover:text-terminal-white'
            }`}
          >
            <TerminalIcon className="w-4 h-4 inline mr-1" />
            Terminal
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              activeTab === 'history'
                ? 'bg-terminal-accent text-vps-bg'
                : 'text-terminal-muted hover:text-terminal-white'
            }`}
          >
            <History className="w-4 h-4 inline mr-1" />
            Historial
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-vps-card rounded-lg border border-vps-border overflow-hidden min-h-[500px]">
        {activeTab === 'terminal' ? (
          <TerminalView />
        ) : (
          <div className="p-6 text-terminal-muted">
            <p>Historial de sesiones - Próximamente</p>
          </div>
        )}
      </div>
    </div>
  );
}
