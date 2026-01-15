/**
 * Files Page
 * Full-screen file browser with macOS Finder-style column view
 */

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Sidebar } from '../chat/Sidebar';
import FileExplorer from '../files/FileExplorer';
import { FileUploadModal } from '../files';
import { AuthModal } from '../auth/AuthModal';
import { Modal as SettingsModal } from '../settings/Modal';

// Hamburger menu icon for mobile
const MenuIcon = ({ size = 24, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const FilesPage = () => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const isMobile = useIsMobile();

  // Sidebar state (same pattern as other pages)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(!isMobile);
  const [isSidebarVisible, setIsSidebarVisible] = useState(!isMobile);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState('/');

  // Handle sidebar toggle
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsSidebarVisible(!isSidebarVisible);
    } else {
      setIsSidebarExpanded(!isSidebarExpanded);
    }
  }, [isMobile, isSidebarVisible, isSidebarExpanded]);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    if (isMobile && isSidebarVisible) {
      const handleClickOutside = (e) => {
        if (!e.target.closest('[data-sidebar]')) {
          setIsSidebarVisible(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobile, isSidebarVisible]);

  // Handle upload from FileExplorer
  const handleUpload = useCallback((path) => {
    setUploadFolder(path);
    setIsUploadModalOpen(true);
  }, []);

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100dvh',
      minHeight: '100vh',
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <Sidebar
        expanded={isSidebarExpanded}
        visible={isSidebarVisible}
        onToggle={toggleSidebar}
        onClose={() => setIsSidebarVisible(false)}
        isMobile={isMobile}
      />

      {/* Mobile sidebar overlay */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            opacity: isSidebarVisible ? 1 : 0,
            pointerEvents: isSidebarVisible ? 'auto' : 'none',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onClick={() => setIsSidebarVisible(false)}
        />
      )}

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.bg.primary,
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily.sans,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Mobile hamburger menu button (top-left) */}
        {isMobile && (
          <div
            data-sidebar
            style={{
              position: 'fixed',
              top: theme.spacing.md,
              left: theme.spacing.md,
              zIndex: 10,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                background: 'transparent',
                border: 'none',
                borderRadius: theme.radius.lg,
                cursor: 'pointer',
                color: theme.colors.text.secondary,
                transition: `all ${theme.animation.fast}`,
              }}
              title="Menu"
            >
              <MenuIcon size={20} />
            </button>
          </div>
        )}

        {/* File Explorer - full height */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: isMobile ? '60px' : 0,
        }}>
          <FileExplorer
            expanded={true}
            onUpload={handleUpload}
          />
        </div>
      </main>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        initialFolder={uploadFolder}
      />

      {/* Settings Modal */}
      <SettingsModal />

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
};

export default FilesPage;
