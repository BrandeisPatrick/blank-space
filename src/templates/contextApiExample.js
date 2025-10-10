// Context API example with theme and authentication
export const contextApiFiles = {
  "/App.js": {
    code: `import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import './styles.css';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Layout />
      </ThemeProvider>
    </AuthProvider>
  );
}`,
  },
  "/context/ThemeContext.js": {
    code: `import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [accentColor, setAccentColor] = useState('#3b82f6');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    accentColor,
    setAccentColor,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}`,
  },
  "/context/AuthContext.js": {
    code: `import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const mockUsers = [
  { id: 1, username: 'demo', password: 'demo', name: 'Demo User', role: 'admin' },
  { id: 2, username: 'user', password: 'user', name: 'Regular User', role: 'user' }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username, password) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundUser = mockUsers.find(
      u => u.username === username && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}`,
  },
  "/components/Layout.js": {
    code: `import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import LoginForm from './LoginForm';
import Dashboard from './Dashboard';

export default function Layout() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <div className={\`app \${theme}\`}>
      <Header />
      <main className="main-content">
        {isAuthenticated ? <Dashboard /> : <LoginForm />}
      </main>
    </div>
  );
}`,
  },
  "/components/Header.js": {
    code: `import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <h1>🎨 Context API Demo</h1>

        <div className="header-controls">
          {isAuthenticated && (
            <span className="user-badge">
              👤 {user.name}
            </span>
          )}

          <button
            onClick={toggleTheme}
            className="theme-btn"
            title="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="color-picker"
            title="Choose accent color"
          />

          {isAuthenticated && (
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}`,
  },
  "/components/LoginForm.js": {
    code: `import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const { accentColor } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(username, password);

    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        <p className="login-hint">
          Try: demo/demo or user/user
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            style={{ background: accentColor }}
            className="submit-btn"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}`,
  },
  "/components/Dashboard.js": {
    code: `import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import FeatureCard from './FeatureCard';

export default function Dashboard() {
  const { user } = useAuth();
  const { accentColor, isDark } = useTheme();

  const features = [
    {
      icon: '🎨',
      title: 'Theme Context',
      description: 'Shared theme state across all components'
    },
    {
      icon: '🔐',
      title: 'Auth Context',
      description: 'Global authentication state management'
    },
    {
      icon: '🎯',
      title: 'Easy Access',
      description: 'Use useTheme() and useAuth() hooks anywhere'
    }
  ];

  return (
    <div className="dashboard">
      <div className="welcome-banner" style={{ borderColor: accentColor }}>
        <h2>Welcome back, {user.name}! 👋</h2>
        <p>Role: <strong>{user.role}</strong></p>
        <p className="context-info">
          This data comes from the AuthContext, accessible anywhere in the component tree!
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>

      <div className="context-demo">
        <h3>Context State Demo</h3>
        <div className="state-grid">
          <div className="state-item">
            <span className="state-label">Current Theme:</span>
            <span className="state-value">{isDark ? 'Dark 🌙' : 'Light ☀️'}</span>
          </div>
          <div className="state-item">
            <span className="state-label">Accent Color:</span>
            <span className="state-value">
              <span className="color-dot" style={{ background: accentColor }} />
              {accentColor}
            </span>
          </div>
          <div className="state-item">
            <span className="state-label">User ID:</span>
            <span className="state-value">{user.id}</span>
          </div>
          <div className="state-item">
            <span className="state-label">Username:</span>
            <span className="state-value">{user.username}</span>
          </div>
        </div>
      </div>
    </div>
  );
}`,
  },
  "/components/FeatureCard.js": {
    code: `import { useTheme } from '../context/ThemeContext';

export default function FeatureCard({ icon, title, description }) {
  const { accentColor } = useTheme();

  return (
    <div className="feature-card">
      <div className="feature-icon" style={{ color: accentColor }}>
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
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

.app {
  min-height: 100vh;
  transition: all 0.3s ease;
}

.app.light {
  background: #f5f7fa;
  color: #1f2937;
}

.app.dark {
  background: #1f2937;
  color: #f3f4f6;
}

/* Header */
.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header h1 {
  font-size: 1.5rem;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-badge {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.theme-btn, .logout-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.logout-btn {
  font-size: 14px;
  font-weight: 600;
  color: inherit;
}

.theme-btn:hover, .logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.color-picker {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* Main Content */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* Login */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.login-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-card h2 {
  margin-bottom: 8px;
  text-align: center;
}

.login-hint {
  text-align: center;
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  font-size: 16px;
}

.form-group input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
}

.error {
  padding: 12px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Dashboard */
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-banner {
  padding: 32px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border-left: 4px solid;
}

.welcome-banner h2 {
  margin-bottom: 12px;
}

.welcome-banner p {
  opacity: 0.9;
  margin-bottom: 8px;
}

.context-info {
  margin-top: 12px;
  font-size: 14px;
  font-style: italic;
  opacity: 0.7;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.feature-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.3);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.feature-card h3 {
  margin-bottom: 8px;
}

.feature-card p {
  opacity: 0.8;
  font-size: 14px;
}

.context-demo {
  padding: 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
}

.context-demo h3 {
  margin-bottom: 20px;
}

.state-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.state-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.state-label {
  font-size: 14px;
  opacity: 0.7;
}

.state-value {
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
}`,
  },
};
