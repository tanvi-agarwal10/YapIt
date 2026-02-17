import { useState, useEffect } from 'react';
import apiClient from '../utils/api';
import { useSocket } from '../utils/socket';

export default function DeploymentDebug() {
  const [config, setConfig] = useState<any>({});
  const [healthStatus, setHealthStatus] = useState<string>('Not tested');
  const [socketStatus, setSocketStatus] = useState<string>('Not tested');
  const { isConnected } = useSocket();

  useEffect(() => {
    setConfig({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
      NODE_ENV: process.env.NODE_ENV,
    });
  }, []);

  useEffect(() => {
    setSocketStatus(isConnected ? 'Connected' : 'Disconnected');
  }, [isConnected]);

  const checkHealth = async () => {
    try {
      setHealthStatus('Checking...');
      // Try to hit the health endpoint directly using axios to see full error if any
      const res = await apiClient.get('/health'); // assuming /api/health exists or is mounted
      // If /api/health is the endpoint, and baseURL is /api, then .get('/health') works.
      // Let's also try the root if that fails, just in case.
      setHealthStatus(`OK: ${JSON.stringify(res.data)}`);
    } catch (err: any) {
      console.error(err);
      setHealthStatus(`Error: ${err.message} ${err.response ? JSON.stringify(err.response.data) : ''}`);
    }
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Deployment Debug</h1>
      
      <div className="mb-6 p-4 border border-gray-700 rounded bg-gray-800">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        <pre className="bg-black p-2 rounded overflow-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
        <p className="mt-2 text-sm text-gray-400">
          Note: These values are read from <code>process.env</code> in the browser bundle.
        </p>
      </div>

      <div className="mb-6 p-4 border border-gray-700 rounded bg-gray-800">
        <h2 className="text-xl font-semibold mb-2">API Connectivity</h2>
        <button 
          onClick={checkHealth}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Test API Connection
        </button>
        <div className="mt-4">
          <strong>Status:</strong> <span className={healthStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'}>{healthStatus}</span>
        </div>
      </div>

      <div className="mb-6 p-4 border border-gray-700 rounded bg-gray-800">
        <h2 className="text-xl font-semibold mb-2">Socket Connectivity</h2>
        <div className="mt-2">
          <strong>Status:</strong> <span className={isConnected ? 'text-green-400' : 'text-red-400'}>{socketStatus}</span>
        </div>
      </div>
    </div>
  );
}
