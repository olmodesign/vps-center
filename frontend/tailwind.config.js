export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'vps': { 'bg': '#0a0e14', 'surface': '#0f1419', 'surface-light': '#151b23', 'border': '#1e2630', 'border-light': '#2a3441' },
        'terminal': { 'green': '#00ff9f', 'green-dim': '#00b371', 'cyan': '#00d4ff', 'cyan-dim': '#0099b8', 'yellow': '#ffcc00', 'red': '#ff3366', 'white': '#e6e6e6', 'gray': '#6b7280' },
      },
      fontFamily: { 'mono': ['JetBrains Mono', 'Fira Code', 'monospace'], 'sans': ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: { 'glow-green': '0 0 20px rgba(0, 255, 159, 0.3)', 'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.3)' },
    },
  },
  plugins: [],
};
