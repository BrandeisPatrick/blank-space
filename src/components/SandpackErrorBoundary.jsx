import { Component } from 'react';

class SandpackErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Sandpack Error:', error, errorInfo);
    this.state = { hasError: true, error, errorInfo };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          background: '#1e1e1e',
          color: '#fff',
          borderRadius: '8px',
          border: '2px solid #ff6b6b',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <h2 style={{ color: '#ff6b6b', margin: 0 }}>⚠️ Sandpack Error</h2>
          <p style={{ textAlign: 'center', maxWidth: '600px', margin: 0, color: '#ccc' }}>
            Failed to load the live code editor. This is usually caused by:
          </p>
          <ul style={{ textAlign: 'left', color: '#aaa', lineHeight: '1.8' }}>
            <li>Network connectivity issues</li>
            <li>CDN (jsdelivr) being blocked or unavailable</li>
            <li>Firewall or proxy restrictions</li>
            <li>Browser extension conflicts</li>
          </ul>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '8px 16px',
                background: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                transition: 'all 0.15s',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => e.target.style.background = '#0052a3'}
              onMouseLeave={(e) => e.target.style.background = '#0066cc'}
            >
              🔄 Retry
            </button>
            <button
              onClick={() => window.open('https://sandpack.codesandbox.io/', '_blank')}
              style={{
                padding: '8px 16px',
                background: '#2d2d30',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                transition: 'all 0.15s',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => e.target.style.background = '#3d3d40'}
              onMouseLeave={(e) => e.target.style.background = '#2d2d30'}
            >
              📚 Learn More
            </button>
          </div>
          {this.state.error && (
            <details style={{
              marginTop: '20px',
              padding: '15px',
              background: '#2d2d30',
              borderRadius: '4px',
              width: '100%',
              maxWidth: '600px',
              cursor: 'pointer'
            }}>
              <summary style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                Error Details
              </summary>
              <pre style={{
                fontSize: '12px',
                color: '#ff6b6b',
                overflow: 'auto',
                margin: 0
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default SandpackErrorBoundary;
