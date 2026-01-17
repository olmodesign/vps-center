import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { io } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const WS_URL = import.meta.env.VITE_WS_URL || API_URL.replace('https', 'wss').replace('http', 'ws');

export default function TerminalView({ onClose }) {
  const terminalRef = useRef(null);
  const termRef = useRef(null);
  const socketRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Crear terminal
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", monospace',
      theme: {
        background: '#0a0e14',
        foreground: '#b3b1ad',
        cursor: '#f29718',
        cursorAccent: '#0a0e14',
        selection: 'rgba(242, 151, 24, 0.3)',
        black: '#0a0e14',
        red: '#ff3333',
        green: '#7acc81',
        yellow: '#f29718',
        blue: '#36a3d9',
        magenta: '#f07178',
        cyan: '#95e6cb',
        white: '#b3b1ad',
        brightBlack: '#4d5566',
        brightRed: '#ff6565',
        brightGreen: '#91d69c',
        brightYellow: '#ffb454',
        brightBlue: '#6bb7e0',
        brightMagenta: '#f79dac',
        brightCyan: '#b0e8d5',
        brightWhite: '#fafafa',
      },
    });

    // Addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Conectar WebSocket
    const token = localStorage.getItem('accessToken');
    const socket = io(`${WS_URL}/terminal`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('terminal:create', { path: '/root' });
    });

    socket.on('terminal:created', (data) => {
      setSessionId(data.sessionId);
      term.writeln('\x1b[32m● Terminal conectado\x1b[0m');
      term.writeln('');
    });

    socket.on('terminal:output', (data) => {
      term.write(data.data);
    });

    socket.on('terminal:exit', (data) => {
      term.writeln('');
      term.writeln(`\x1b[31m● Proceso terminado (código: ${data.exitCode})\x1b[0m`);
      setConnected(false);
    });

    socket.on('terminal:error', (data) => {
      term.writeln(`\x1b[31mError: ${data.message}\x1b[0m`);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      term.writeln('');
      term.writeln('\x1b[31m● Desconectado del servidor\x1b[0m');
    });

    socket.on('connect_error', (error) => {
      term.writeln(`\x1b[31mError de conexión: ${error.message}\x1b[0m`);
    });

    // Input del usuario
    term.onData((data) => {
      if (sessionId || socket.connected) {
        socket.emit('terminal:input', { sessionId, data });
      }
    });

    // Resize
    const handleResize = () => {
      fitAddon.fit();
      if (sessionId) {
        socket.emit('terminal:resize', {
          sessionId,
          cols: term.cols,
          rows: term.rows,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Resize observer para el contenedor
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      socket.disconnect();
      term.dispose();
    };
  }, []);

  // Actualizar sessionId cuando cambie
  useEffect(() => {
    if (sessionId && termRef.current && socketRef.current) {
      const term = termRef.current;
      const socket = socketRef.current;

      // Re-bind input handler con nuevo sessionId
      term.onData((data) => {
        socket.emit('terminal:input', { sessionId, data });
      });

      // Enviar resize inicial
      socket.emit('terminal:resize', {
        sessionId,
        cols: term.cols,
        rows: term.rows,
      });
    }
  }, [sessionId]);

  return (
    <div className="flex flex-col h-full bg-vps-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-vps-card border-b border-vps-border">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-mono text-terminal-text">
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
          {sessionId && (
            <span className="text-xs text-terminal-muted">
              Sesión: {sessionId}
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-terminal-muted hover:text-terminal-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Terminal */}
      <div 
        ref={terminalRef} 
        className="flex-1 p-2"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
