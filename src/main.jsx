import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { UserProfileProvider } from './contexts/UserProfileContext.jsx'
import { SubscriptionProvider } from './contexts/SubscriptionContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { ArtifactProvider } from './contexts/ArtifactContext.jsx'
import { SettingsProvider } from './contexts/SettingsContext.jsx'
import { ChatAppProvider } from './contexts/ChatAppContext.jsx'
import { AppStoreProvider } from './contexts/AppStoreContext.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <UserProfileProvider>
        <SubscriptionProvider>
          <ThemeProvider>
            <SettingsProvider>
              <ChatAppProvider>
                <AppStoreProvider>
                  <ArtifactProvider>
                    <App />
                  </ArtifactProvider>
                </AppStoreProvider>
              </ChatAppProvider>
            </SettingsProvider>
          </ThemeProvider>
        </SubscriptionProvider>
      </UserProfileProvider>
    </AuthProvider>
  </React.StrictMode>,
)
