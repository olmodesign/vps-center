import { Terminal } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-vps-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-vps-surface border border-terminal-green/50 rounded-lg flex items-center justify-center">
          <Terminal className="w-8 h-8 text-terminal-green animate-pulse" />
        </div>
        <h1 className="text-2xl font-mono font-bold text-terminal-green mb-2">VPS CENTER</h1>
        <div className="flex items-center justify-center gap-2 text-terminal-gray font-mono text-sm">
          <span className="w-2 h-2 bg-terminal-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-terminal-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-terminal-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
