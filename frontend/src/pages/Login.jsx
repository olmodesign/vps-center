import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Eye, EyeOff, AlertCircle, Shield, ArrowLeft } from 'lucide-react';
import useAuthStore from '../hooks/useAuth';

function Login() {
  const navigate = useNavigate();
  const { login, loginWithTotp, cancelTwoFactor, isLoading, error, requiresTwoFactor, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();
    const result = await login(email, password);
    if (result.success) navigate('/');
  };

  const handleTotpSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await loginWithTotp(totpCode);
    if (result.success) navigate('/');
  };

  return (
    <div className="min-h-screen bg-vps-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-vps-surface border border-terminal-green/50 rounded-lg mb-4">
            <Terminal className="w-8 h-8 text-terminal-green" />
          </div>
          <h1 className="text-3xl font-mono font-bold text-terminal-green">VPS CENTER</h1>
          <p className="text-terminal-gray mt-2 font-mono text-sm">
            {requiresTwoFactor ? '// 2FA Verification Required' : '// Access your command center'}
          </p>
        </div>

        <div className="bg-vps-surface border border-vps-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-vps-border">
            <div className="w-3 h-3 rounded-full bg-terminal-red"></div>
            <div className="w-3 h-3 rounded-full bg-terminal-yellow"></div>
            <div className="w-3 h-3 rounded-full bg-terminal-green"></div>
            <span className="ml-2 text-terminal-gray text-xs font-mono">
              {requiresTwoFactor ? 'auth://2fa-verify' : 'auth://login'}
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-terminal-red/10 border border-terminal-red/30 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-terminal-red flex-shrink-0 mt-0.5" />
              <p className="text-sm text-terminal-red">{error}</p>
            </div>
          )}

          {!requiresTwoFactor ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label font-mono"><span className="text-terminal-cyan">$</span> email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input font-mono" placeholder="admin@example.com" required autoFocus />
              </div>
              <div>
                <label className="label font-mono"><span className="text-terminal-cyan">$</span> password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input font-mono pr-10" placeholder="********" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-gray hover:text-terminal-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full font-mono">
                {isLoading ? 'Authenticating...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleTotpSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <Shield className="w-12 h-12 mx-auto text-terminal-cyan mb-3" />
                <p className="text-terminal-gray text-sm">Enter the 6-digit code from your authenticator app</p>
              </div>
              <div>
                <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="input font-mono text-center text-2xl tracking-widest" placeholder="000000" maxLength={6} autoFocus />
              </div>
              <button type="submit" disabled={isLoading || totpCode.length !== 6} className="btn-primary w-full font-mono">
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
              <button type="button" onClick={() => { cancelTwoFactor(); setTotpCode(''); }} className="btn-ghost w-full font-mono text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
