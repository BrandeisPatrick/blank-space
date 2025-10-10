// Real-time Dashboard example
export const realtime = {
  name: 'Real-time Dashboard',
  files: {
    'App.jsx': `import MetricCard from './components/MetricCard';
import StatsPanel from './components/StatsPanel';
import MetricsChart from './components/MetricsChart';
import LogViewer from './components/LogViewer';
import { useRealtimeMetrics } from './hooks/useRealtimeMetrics';
import { useLiveLogs } from './hooks/useLiveLogs';

export default function App() {
  const { metrics, history, stats } = useRealtimeMetrics();
  const { logs } = useLiveLogs();

  const metricCards = [
    { label: 'CPU Usage', value: \`\${metrics.cpu.toFixed(1)}%\`, color: '#3b82f6' },
    { label: 'Memory', value: \`\${metrics.memory.toFixed(1)}%\`, color: '#10b981' },
    { label: 'Network', value: \`\${metrics.network.toFixed(0)} MB/s\`, color: '#f59e0b' },
    { label: 'Requests/s', value: metrics.requests, color: '#8b5cf6' }
  ];

  return (
    <div style={{ padding: '20px', background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ marginBottom: '30px' }}>Real-time Dashboard - Performance Test</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {metricCards.map(metric => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <StatsPanel stats={stats} />
      <MetricsChart history={history} />
      <LogViewer logs={logs} />
    </div>
  );
}`,
    'components/MetricCard.jsx': `export default function MetricCard({ label, value, color }) {
  return (
    <div style={{
      background: '#1e293b',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #334155'
    }}>
      <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '10px' }}>
        {label}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color }}>
        {value}
      </div>
    </div>
  );
}`,
    'components/StatsPanel.jsx': `export default function StatsPanel({ stats }) {
  return (
    <div style={{
      background: '#1e293b',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '30px',
      border: '1px solid #334155'
    }}>
      <h2 style={{ marginTop: 0 }}>Statistics (Last 50 samples)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <div>Avg CPU: <strong>{stats.avgCpu}%</strong></div>
        <div>Avg Memory: <strong>{stats.avgMemory}%</strong></div>
        <div>Total Requests: <strong>{stats.totalRequests}</strong></div>
        <div>Max Network: <strong>{stats.maxNetwork} MB/s</strong></div>
      </div>
    </div>
  );
}`,
    'components/MetricsChart.jsx': `export default function MetricsChart({ history }) {
  return (
    <div style={{
      background: '#1e293b',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '30px',
      border: '1px solid #334155'
    }}>
      <h2 style={{ marginTop: 0 }}>CPU & Memory History</h2>
      <div style={{ height: '200px', position: 'relative' }}>
        <svg width="800" height="200" viewBox="0 0 800 200" preserveAspectRatio="none" style={{ width: '100%', height: '200px' }}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={200 - (y * 2)}
              x2="800"
              y2={200 - (y * 2)}
              stroke="#334155"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* CPU line */}
          <polyline
            points={history.map((m, i) =>
              \`\${(i / 50) * 800},\${200 - (m.cpu * 2)}\`
            ).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Memory line */}
          <polyline
            points={history.map((m, i) =>
              \`\${(i / 50) * 800},\${200 - (m.memory * 2)}\`
            ).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <div><span style={{ color: '#3b82f6' }}>━</span> CPU</div>
          <div><span style={{ color: '#10b981' }}>━</span> Memory</div>
        </div>
      </div>
    </div>
  );
}`,
    'components/LogViewer.jsx': `export default function LogViewer({ logs }) {
  return (
    <div style={{
      background: '#1e293b',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #334155'
    }}>
      <h2 style={{ marginTop: 0 }}>Live Logs ({logs.length})</h2>
      <div style={{
        maxHeight: '300px',
        overflow: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{
            padding: '8px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            gap: '10px'
          }}>
            <span style={{
              color: log.type === 'ERROR' ? '#ef4444' :
                     log.type === 'WARN' ? '#f59e0b' :
                     log.type === 'INFO' ? '#3b82f6' : '#6b7280'
            }}>
              [{log.type}]
            </span>
            <span style={{ color: '#64748b' }}>{log.timestamp}</span>
            <span style={{ flex: 1 }}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}`,
    'hooks/useRealtimeMetrics.js': `import { useState, useEffect, useMemo } from 'react';

export function useRealtimeMetrics() {
  const [metrics, setMetrics] = useState({
    cpu: 0,
    memory: 0,
    network: 0,
    requests: 0
  });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newMetrics = {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        network: Math.random() * 1000,
        requests: Math.floor(Math.random() * 500),
        timestamp: Date.now()
      };

      setMetrics(newMetrics);
      setHistory(prev => [...prev, newMetrics].slice(-50));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => ({
    avgCpu: history.length ? (history.reduce((sum, m) => sum + m.cpu, 0) / history.length).toFixed(2) : 0,
    avgMemory: history.length ? (history.reduce((sum, m) => sum + m.memory, 0) / history.length).toFixed(2) : 0,
    totalRequests: history.reduce((sum, m) => sum + m.requests, 0),
    maxNetwork: history.length ? Math.max(...history.map(m => m.network)).toFixed(2) : 0
  }), [history]);

  return { metrics, history, stats };
}`,
    'hooks/useLiveLogs.js': `import { useState, useEffect } from 'react';

export function useLiveLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const logTypes = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
        const logMessages = [
          'Request processed successfully',
          'Database connection established',
          'Cache miss - fetching from database',
          'API rate limit approaching',
          'Memory usage spike detected'
        ];

        setLogs(prev => [{
          type: logTypes[Math.floor(Math.random() * logTypes.length)],
          message: logMessages[Math.floor(Math.random() * logMessages.length)],
          timestamp: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 100));
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return { logs };
}`,
    'styles.css': `body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
}`
  }
};
