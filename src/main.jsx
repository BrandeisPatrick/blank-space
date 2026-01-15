import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { UserProfileProvider } from './contexts/UserProfileContext.jsx'
import { SubscriptionProvider } from './contexts/SubscriptionContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { ArtifactProvider } from './contexts/ArtifactContext.jsx'
import { SettingsProvider } from './contexts/SettingsContext.jsx'
import { ConversationProvider } from './contexts/ConversationContext.jsx'
import { AppStoreProvider } from './contexts/AppStoreContext.jsx'
import { FileSystemProvider } from './contexts/FileSystemContext.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <UserProfileProvider>
        <SubscriptionProvider>
          <ThemeProvider>
            <SettingsProvider>
              <ConversationProvider>
                <AppStoreProvider>
                  <ArtifactProvider>
                    <FileSystemProvider>
                      <App />
                    </FileSystemProvider>
                  </ArtifactProvider>
                </AppStoreProvider>
              </ConversationProvider>
            </SettingsProvider>
          </ThemeProvider>
        </SubscriptionProvider>
      </UserProfileProvider>
    </AuthProvider>
  </React.StrictMode>,
)
