// Multi-component dashboard example with file structure
export const multiComponentFiles = {
  "/App.js": {
    code: `import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import './styles.css';

export default function App() {
  const [selectedView, setSelectedView] = useState('overview');

  return (
    <div className="app-container">
      <Sidebar
        selectedView={selectedView}
        onViewChange={setSelectedView}
      />
      <Dashboard view={selectedView} />
    </div>
  );
}`,
  },
  "/components/Dashboard.js": {
    code: `import { useState, useEffect } from 'react';
import Card from './Card';
import UserList from './UserList';

export default function Dashboard({ view }) {
  const [stats, setStats] = useState({
    users: 1234,
    revenue: 45678,
    orders: 892
  });

  return (
    <div className="dashboard">
      <h1>{view.charAt(0).toUpperCase() + view.slice(1)}</h1>

      {view === 'overview' && (
        <div className="stats-grid">
          <Card
            title="Total Users"
            value={stats.users.toLocaleString()}
            trend="+12%"
            color="#3b82f6"
          />
          <Card
            title="Revenue"
            value={\`$\${stats.revenue.toLocaleString()}\`}
            trend="+8%"
            color="#10b981"
          />
          <Card
            title="Orders"
            value={stats.orders.toLocaleString()}
            trend="+23%"
            color="#f59e0b"
          />
        </div>
      )}

      {view === 'users' && <UserList />}

      {view === 'settings' && (
        <div className="settings">
          <h2>Settings Panel</h2>
          <p>Configure your dashboard here.</p>
        </div>
      )}
    </div>
  );
}`,
  },
  "/components/Card.js": {
    code: `export default function Card({ title, value, trend, color }) {
  const isPositive = trend.startsWith('+');

  return (
    <div className="card" style={{ borderLeft: \`4px solid \${color}\` }}>
      <h3 className="card-title">{title}</h3>
      <div className="card-value">{value}</div>
      <div className={\`card-trend \${isPositive ? 'positive' : 'negative'}\`}>
        {trend}
      </div>
    </div>
  );
}`,
  },
  "/components/Sidebar.js": {
    code: `const menuItems = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

export default function Sidebar({ selectedView, onViewChange }) {
  return (
    <div className="sidebar">
      <div className="logo">
        <h2>🚀 Dashboard</h2>
      </div>

      <nav className="menu">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={selectedView === item.id ? 'active' : ''}
            onClick={() => onViewChange(item.id)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}`,
  },
  "/components/UserList.js": {
    code: `import { useState } from 'react';

const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'active' },
  { id: 3, name: 'Carol White', email: 'carol@example.com', status: 'inactive' },
  { id: 4, name: 'David Brown', email: 'david@example.com', status: 'active' },
];

export default function UserList() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="user-list">
      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      <div className="users">
        {filteredUsers.map(user => (
          <div key={user.id} className="user-card">
            <div className="user-avatar">
              {user.name.charAt(0)}
            </div>
            <div className="user-info">
              <h4>{user.name}</h4>
              <p>{user.email}</p>
            </div>
            <span className={\`status-badge \${user.status}\`}>
              {user.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}`,
  },
  "/styles.css": {
    code: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f7fa;
}

.app-container {
  display: flex;
  height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 250px;
  background: #1f2937;
  color: white;
  padding: 20px;
}

.logo h2 {
  margin-bottom: 30px;
  font-size: 1.5rem;
}

.menu button {
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: transparent;
  color: #9ca3af;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  transition: all 0.2s;
}

.menu button:hover {
  background: #374151;
  color: white;
}

.menu button.active {
  background: #3b82f6;
  color: white;
}

.icon {
  font-size: 1.2rem;
}

/* Dashboard */
.dashboard {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

.dashboard h1 {
  margin-bottom: 30px;
  color: #1f2937;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card-title {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
  font-weight: 500;
}

.card-value {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8px;
}

.card-trend {
  font-size: 14px;
  font-weight: 600;
}

.card-trend.positive {
  color: #10b981;
}

.card-trend.negative {
  color: #ef4444;
}

/* User List */
.user-list {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.users {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.user-card:hover {
  border-color: #3b82f6;
  background: #f9fafb;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
}

.user-info {
  flex: 1;
}

.user-info h4 {
  margin-bottom: 4px;
  color: #1f2937;
}

.user-info p {
  font-size: 14px;
  color: #6b7280;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.settings {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.settings h2 {
  margin-bottom: 12px;
  color: #1f2937;
}

.settings p {
  color: #6b7280;
}`,
  },
};
