import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { ArtifactProvider } from './contexts/ArtifactContext.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <ArtifactProvider>
          <App />
        </ArtifactProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
)
