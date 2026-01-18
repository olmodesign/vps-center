import { useState, useEffect } from 'react';
import { 
  Globe, 
  Server, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Lock
} from 'lucide-react';
import { traefikApi } from '../api/client';

export default function Traefik() {
  const [overview, setOverview] = useState(null);
  const [routers, setRouters] = useState([]);
  const [services, setServices] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [activeTab, setActiveTab] = useState('routers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, routersRes, servicesRes, certsRes] = await Promise.all([
        traefikApi.getOverview(),
        traefikApi.getRouters(),
        traefikApi.getServices(),
        traefikApi.getCertificates()
      ]);
      
      setOverview(overviewRes.data.data);
      setRouters(routersRes.data.data);
      setServices(servicesRes.data.data);
      setCertificates(certsRes.data.data);
      setError(null);
    } catch (err) {
      setError('Error conectando con Traefik');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'routers', name: 'Routers', count: routers.length },
    { id: 'services', name: 'Services', count: services.length },
    { id: 'certificates', name: 'Certificados', count: certificates.length }
  ];

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Traefik</h1>
          <p className="text-gray-400">Reverse Proxy & Load Balancer</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${overview?.status === 'healthy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {overview?.status === 'healthy' ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-gray-400 text-sm">Estado</p>
              <p className="text-white font-semibold capitalize">{overview?.status || 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Routers</p>
              <p className="text-white font-semibold">{overview?.routers?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Server className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Services</p>
              <p className="text-white font-semibold">{overview?.services || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Lock className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Certificados SSL</p>
              <p className="text-white font-semibold">{certificates.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-700">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.name}
              <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {activeTab === 'routers' && (
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Nombre</th>
                <th className="text-left p-4 text-gray-400 font-medium">Regla</th>
                <th className="text-left p-4 text-gray-400 font-medium">Servicio</th>
                <th className="text-left p-4 text-gray-400 font-medium">TLS</th>
                <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {routers.map((router, idx) => (
                <tr key={idx} className="hover:bg-gray-700/50">
                  <td className="p-4 text-white font-mono text-sm">{router.name}</td>
                  <td className="p-4 text-gray-300 text-sm max-w-md truncate">{router.rule}</td>
                  <td className="p-4 text-gray-300 text-sm">{router.service}</td>
                  <td className="p-4">
                    {router.tls ? (
                      <span className="inline-flex items-center gap-1 text-green-400">
                        <Lock className="w-4 h-4" /> SSL
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      router.status === 'enabled' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'
                    }`}>
                      {router.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'services' && (
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Nombre</th>
                <th className="text-left p-4 text-gray-400 font-medium">Tipo</th>
                <th className="text-left p-4 text-gray-400 font-medium">Provider</th>
                <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {services.map((service, idx) => (
                <tr key={idx} className="hover:bg-gray-700/50">
                  <td className="p-4 text-white font-mono text-sm">{service.name}</td>
                  <td className="p-4 text-gray-300 text-sm">{service.type}</td>
                  <td className="p-4 text-gray-300 text-sm">{service.provider}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      service.status === 'enabled' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'
                    }`}>
                      {service.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'certificates' && (
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Dominio</th>
                <th className="text-left p-4 text-gray-400 font-medium">Cert Resolver</th>
                <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {certificates.map((cert, idx) => (
                <tr key={idx} className="hover:bg-gray-700/50">
                  <td className="p-4 text-white font-mono text-sm">{cert.domain}</td>
                  <td className="p-4 text-gray-300 text-sm">{cert.certResolver}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                      <CheckCircle className="w-3 h-3" />
                      {cert.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
