/**
 * Interactive Dashboard
 * SVG-based charts without external libraries - Modern design with SVG icons
 */

export const interactiveDashboardArtifact = {
  id: 'interactive-dashboard',
  name: 'Interactive Dashboard',
  description: 'An analytics dashboard with animated bar charts, line graphs, and donut charts built entirely with pure SVG - no chart libraries needed. Features stat cards with change indicators, tab navigation, and responsive grid layouts.',
  icon: 'chart',
  category: 'demos',
  files: {
    'App.jsx': `
// SVG Icon Components
const DollarIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const PackageIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const TrendingUpIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

// Mini Bar Chart Component (Pure SVG)
function BarChart({ data, height = 120 }) {
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = 100 / data.length;

  return (
    <svg viewBox="0 0 100 50" className="w-full" style={{ height }}>
      {data.map((item, i) => {
        const barHeight = (item.value / maxValue) * 40;
        return (
          <motion.rect
            key={i}
            x={i * barWidth + barWidth * 0.1}
            y={45 - barHeight}
            width={barWidth * 0.8}
            height={barHeight}
            rx="1"
            fill={item.color || '#818cf8'}
            initial={{ height: 0, y: 45 }}
            animate={{ height: barHeight, y: 45 - barHeight }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
          />
        );
      })}
    </svg>
  );
}

// Mini Line Chart Component (Pure SVG)
function LineChart({ data, height = 120, color = '#22c55e' }) {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 45 - ((value - minValue) / range) * 40;
    return \`\${x},\${y}\`;
  }).join(' ');

  const areaPoints = \`0,45 \${points} 100,45\`;

  return (
    <svg viewBox="0 0 100 50" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polygon
        points={areaPoints}
        fill="url(#lineGradient)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
}

// Donut Chart Component
function DonutChart({ data, size = 120 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -90;

  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
      {data.map((item, i) => {
        const angle = (item.value / total) * 360;
        const startAngle = currentAngle;
        currentAngle += angle;

        const start = polarToCartesian(50, 50, 35, startAngle);
        const end = polarToCartesian(50, 50, 35, startAngle + angle);
        const largeArc = angle > 180 ? 1 : 0;

        const pathD = [
          'M', start.x, start.y,
          'A', 35, 35, 0, largeArc, 1, end.x, end.y
        ].join(' ');

        return (
          <motion.path
            key={i}
            d={pathD}
            fill="none"
            stroke={item.color}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: i * 0.2, duration: 0.8 }}
          />
        );
      })}
      <text x="50" y="50" textAnchor="middle" dy="0.3em" className="text-2xl font-bold fill-white">
        {total}
      </text>
    </svg>
  );
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Stat Card Component
function StatCard({ title, value, change, Icon, color }) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/10"
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={\`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center \${color}\`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <span className={\`text-xs sm:text-sm font-medium px-2 py-1 rounded-full \${isPositive ? 'text-green-400 bg-green-500/20' : 'text-red-400 bg-red-500/20'}\`}>
          {isPositive ? '+' : ''}{change}%
        </span>
      </div>
      <p className="text-slate-400 text-xs sm:text-sm mb-1">{title}</p>
      <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
    </motion.div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const barData = [
    { value: 65, color: '#818cf8' },
    { value: 85, color: '#818cf8' },
    { value: 45, color: '#818cf8' },
    { value: 95, color: '#818cf8' },
    { value: 70, color: '#818cf8' },
    { value: 80, color: '#818cf8' },
  ];

  const lineData = [30, 45, 35, 60, 55, 75, 65, 80, 70, 90, 85, 95];

  const donutData = [
    { value: 45, color: '#818cf8' },
    { value: 30, color: '#22c55e' },
    { value: 25, color: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-slate-400 text-xs sm:text-sm">Pure SVG charts, no libraries needed</p>
          </div>
          <div className="flex gap-2">
            {['overview', 'sales', 'users'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={\`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors \${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }\`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <StatCard title="Total Revenue" value="$48,392" change={12.5} Icon={DollarIcon} color="bg-green-500/20 text-green-400" />
          <StatCard title="Active Users" value="2,845" change={8.2} Icon={UsersIcon} color="bg-blue-500/20 text-blue-400" />
          <StatCard title="Orders" value="1,249" change={-2.4} Icon={PackageIcon} color="bg-orange-500/20 text-orange-400" />
          <StatCard title="Conversion" value="3.24%" change={4.1} Icon={TrendingUpIcon} color="bg-purple-500/20 text-purple-400" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/10"
          >
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Weekly Sales</h3>
            <BarChart data={barData} height={150} />
            <div className="flex justify-between mt-2 sm:mt-3 text-xs text-slate-500">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>
          </motion.div>

          {/* Line Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/10"
          >
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Revenue Trend</h3>
            <LineChart data={lineData} height={150} color="#22c55e" />
            <p className="text-center text-xs text-slate-500 mt-2 sm:mt-3">Last 12 months</p>
          </motion.div>

          {/* Donut Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/10"
          >
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Traffic Sources</h3>
            <div className="flex justify-center">
              <DonutChart data={donutData} size={150} />
            </div>
            <div className="flex justify-center gap-3 sm:gap-4 mt-3 sm:mt-4">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Direct
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Organic
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Referral
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default App;
`
  }
};
