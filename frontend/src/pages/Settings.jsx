import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, User, Shield, Key, Save, RefreshCw,
  AlertCircle, Check, X, Eye, EyeOff, QrCode, Copy, Network
} from 'lucide-react';
import useAuthStore from '../hooks/useAuth';
import { authApi, projectsApi } from '../api/client';

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 font-mono text-sm border-b-2 transition-colors ${
        active 
          ? 'border-terminal-cyan text-terminal-cyan' 
          : 'border-transparent text-terminal-gray hover:text-terminal-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}

function ProfileTab() {
  const { user } = useAuthStore();
  
  return (
    <div className="space-y-6">
      <div className="card border border-vps-border">
        <h3 className="text-lg font-mono font-semibold text-terminal-white mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="label font-mono"><span className="text-terminal-cyan">$</span> email</label>
            <input type="email" value={user?.email || ''} disabled className="input font-mono bg-vps-bg cursor-not-allowed" />
            <p className="text-xs text-terminal-gray mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="label font-mono"><span className="text-terminal-cyan">$</span> role</label>
            <input type="text" value={user?.role || 'user'} disabled className="input font-mono bg-vps-bg cursor-not-allowed" />
          </div>
          <div>
            <label className="label font-mono"><span className="text-terminal-cyan">$</span> member_since</label>
            <input type="text" value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'} disabled className="input font-mono bg-vps-bg cursor-not-allowed" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  const { user, refreshUser } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [totpSetup, setTotpSetup] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      setTotpLoading(true);
      setError(null);
      const res = await authApi.setup2FA();
      setTotpSetup(res.data?.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setTotpLoading(true);
      setError(null);
      await authApi.verify2FA({ token: totpCode });
      setSuccess('2FA enabled successfully');
      setTotpSetup(null);
      setTotpCode('');
      refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setTotpLoading(true);
      setError(null);
      await authApi.disable2FA();
      setSuccess('2FA disabled');
      refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setTotpLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-terminal-red/10 border border-terminal-red/30 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-terminal-red" />
          <p className="text-sm text-terminal-red">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4 text-terminal-red" /></button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-terminal-green/10 border border-terminal-green/30 rounded-md flex items-center gap-2">
          <Check className="w-5 h-5 text-terminal-green" />
          <p className="text-sm text-terminal-green">{success}</p>
        </div>
      )}

      <div className="card border border-vps-border">
        <h3 className="text-lg font-mono font-semibold text-terminal-white mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label font-mono"><span className="text-terminal-cyan">$</span> current_password</label>
            <div className="relative">
              <input type={showPasswords ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input font-mono pr-10" required />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-gray hover:text-terminal-white">
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label font-mono"><span className="text-terminal-cyan">$</span> new_password</label>
            <input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input font-mono" required minLength={8} />
          </div>
          <div>
            <label className="label font-mono"><span className="text-terminal-cyan">$</span> confirm_password</label>
            <input type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input font-mono" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Change Password
          </button>
        </form>
      </div>

      <div className="card border border-vps-border">
        <h3 className="text-lg font-mono font-semibold text-terminal-white mb-4">Two-Factor Authentication</h3>
        {user?.totp_enabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-terminal-green">
              <Shield className="w-5 h-5" />
              <span className="font-mono">2FA is enabled</span>
            </div>
            <button onClick={handleDisable2FA} disabled={totpLoading} className="btn-ghost text-terminal-red hover:bg-terminal-red/10">
              {totpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Disable 2FA
            </button>
          </div>
        ) : totpSetup ? (
          <div className="space-y-4">
            <p className="text-terminal-gray text-sm">Scan this QR code with your authenticator app:</p>
            <div className="bg-white p-4 rounded-md w-fit">
              <img src={totpSetup.qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-vps-bg px-3 py-2 rounded font-mono text-sm text-terminal-cyan">{totpSetup.secret}</code>
              <button onClick={() => copyToClipboard(totpSetup.secret)} className="btn-ghost"><Copy className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="label font-mono"><span className="text-terminal-cyan">$</span> verification_code</label>
              <input type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="input font-mono" placeholder="000000" maxLength={6} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTotpSetup(null)} className="btn-ghost">Cancel</button>
              <button onClick={handleVerify2FA} disabled={totpLoading || totpCode.length !== 6} className="btn-primary">
                {totpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Verify & Enable
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-terminal-gray text-sm">Add an extra layer of security to your account</p>
            <button onClick={handleSetup2FA} disabled={totpLoading} className="btn-primary">
              {totpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              Setup 2FA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PortsTab() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectsApi.getAll();
        setProjects(res.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const allPorts = projects.flatMap(p => (p.ports || []).map(port => ({ ...port, projectName: p.name })));
  const sortedPorts = allPorts.sort((a, b) => a.port_number - b.port_number);

  return (
    <div className="space-y-6">
      <div className="card border border-vps-border">
        <h3 className="text-lg font-mono font-semibold text-terminal-white mb-4">Port Allocation Map</h3>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-vps-surface-light rounded animate-pulse" />)}
          </div>
        ) : sortedPorts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-vps-border">
                  <th className="text-left py-2 px-3 text-terminal-gray font-mono">Port</th>
                  <th className="text-left py-2 px-3 text-terminal-gray font-mono">Protocol</th>
                  <th className="text-left py-2 px-3 text-terminal-gray font-mono">Service</th>
                  <th className="text-left py-2 px-3 text-terminal-gray font-mono">Project</th>
                </tr>
              </thead>
              <tbody>
                {sortedPorts.map((port, i) => (
                  <tr key={i} className="border-b border-vps-border/50 hover:bg-vps-surface-light">
                    <td className="py-2 px-3 font-mono text-terminal-cyan">{port.port_number}</td>
                    <td className="py-2 px-3 font-mono text-terminal-gray">{port.protocol || 'tcp'}</td>
                    <td className="py-2 px-3 text-terminal-white">{port.service_name || '-'}</td>
                    <td className="py-2 px-3 text-terminal-green">{port.projectName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-terminal-gray">
            <Network className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No ports allocated yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono text-terminal-white">Settings</h1>
        <p className="text-terminal-gray mt-1">Manage your account and preferences</p>
      </div>

      <div className="border-b border-vps-border">
        <div className="flex gap-2 overflow-x-auto">
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User}>Profile</TabButton>
          <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Shield}>Security</TabButton>
          <TabButton active={activeTab === 'ports'} onClick={() => setActiveTab('ports')} icon={Network}>Ports</TabButton>
        </div>
      </div>

      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'security' && <SecurityTab />}
      {activeTab === 'ports' && <PortsTab />}
    </div>
  );
}

export default Settings;
