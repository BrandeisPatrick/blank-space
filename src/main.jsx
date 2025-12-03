import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { ArtifactProvider } from './contexts/ArtifactContext.jsx'
import { SettingsProvider } from './contexts/SettingsContext.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <ArtifactProvider>
            <App />
          </ArtifactProvider>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
)
