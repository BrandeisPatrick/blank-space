import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect, getResponsiveSpacing } from '../../styles/componentStyles';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ArtifactCard } from '../artifact/ArtifactCard';
import { SettingsAppCard } from '../settings/SettingsAppCard';
import { Modal as SettingsModal } from '../settings/Modal';
import { AppStoreAppCard } from '../appstore/AppStoreAppCard';
import { AppStorePanel } from '../appstore/AppStorePanel';
import { AuthModal } from '../auth/AuthModal';
import { PreviewWindow } from '../ui/PreviewWindow';
import { Sidebar } from '../chat/Sidebar';
import { LAYOUT, SIZES } from '../../constants';

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

export const ComputerPage = ({
  // Props for browser window functionality
  files = {},
  filesLoading = false,
  onFileChange,
  onError,
  onDebug,
  onDebugNewChat,
  isDebugging = false,
  onIconChange,
  onRename,
}) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const navigate = useNavigate();
  const { projects, loadProject, deleteProject, activeProject, activeProjectSlug, clearActiveProject } = useFileSystem();
  const [isEditMode, setIsEditMode] = useState(false);
  const [browserWindowVisible, setBrowserWindowVisible] = useState(false);
  const isMobile = useIsMobile();

  // Sidebar state (same pattern as ChatPage)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(!isMobile);
  const [isSidebarVisible, setIsSidebarVisible] = useState(!isMobile);

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

  // Enter edit mode (iOS-style jiggle mode for deletion)
  const enterEditMode = () => {
    setIsEditMode(true);
  };

  // Exit edit mode
  const exitEditMode = () => {
    setIsEditMode(false);
  };

  // Handle project deletion
  const handleDeleteProject = (projectSlug, projectName) => {
    if (window.confirm(`Delete "${projectName}"? This cannot be undone.`)) {
      deleteProject(projectSlug);
      if (projects.length <= 1) {
        setIsEditMode(false);
      }
    }
  };

  // Glass effect for header
  const glassEffectStyle = createGlassEffect(theme, { state: 'default' });

  // Handle project selection
  const handleProjectSelect = (projectSlug) => {
    loadProject(projectSlug);
    setBrowserWindowVisible(true);
  };

  // Close browser window
  const handleCloseBrowserWindow = () => {
    setBrowserWindowVisible(false);
    clearActiveProject();
  };

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
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: mode === 'dark' ? '#000000' : '#ffffff',
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily.sans,
        paddingTop: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.CONTENT_PADDING_Y.mobile, SIZES.SPACING.CONTENT_PADDING_Y.desktop),
        paddingLeft: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.CONTENT_PADDING_X.mobile, SIZES.SPACING.CONTENT_PADDING_X.desktop),
        paddingRight: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.CONTENT_PADDING_X.mobile, SIZES.SPACING.CONTENT_PADDING_X.desktop),
        paddingBottom: theme.spacing['3xl'],
        position: 'relative',
        overflow: 'auto',
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


        {/* Content Container */}
        <div style={{
          width: '100%',
          maxWidth: LAYOUT.LANDING_MAX_WIDTH,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing['2xl'],
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          position: 'relative',
          zIndex: LAYOUT.CONTENT_Z_INDEX,
          paddingLeft: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.CONTENT_PADDING_X.mobile, SIZES.SPACING.CONTENT_PADDING_X.desktop),
          paddingRight: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.CONTENT_PADDING_X.mobile, SIZES.SPACING.CONTENT_PADDING_X.desktop),
          paddingTop: isMobile ? theme.spacing['5xl'] : getResponsiveSpacing(theme, isMobile, SIZES.SPACING.CONTENT_PADDING_Y.mobile, SIZES.SPACING.CONTENT_PADDING_Y.desktop),
        }}>
          {/* Done Button - Shows in edit mode */}
          {isEditMode && (
            <div style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.GRID_GAP.mobile, SIZES.SPACING.GRID_GAP.desktop),
              marginBottom: theme.spacing.md,
            }}>
              <div />
              <div />
              <div />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={exitEditMode}
                  style={{
                    ...glassEffectStyle,
                    background: mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'rgba(255, 255, 255, 0.65)',
                    border: 'none',
                    color: theme.colors.text.primary,
                    padding: '8px 20px',
                    borderRadius: theme.radius['2.5xl'],
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: 'pointer',
                    transition: `all ${theme.animation.fast}`,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* App Grid */}
          <div style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.GRID_GAP.mobile, SIZES.SPACING.GRID_GAP.desktop),
            justifyItems: 'center',
          }}>
            {/* Settings App */}
            <SettingsAppCard
              isEditMode={isEditMode}
              onEnterEditMode={enterEditMode}
            />

            {/* AppStore */}
            <AppStoreAppCard
              isEditMode={isEditMode}
              onEnterEditMode={enterEditMode}
            />

            {/* Project Cards */}
            {projects && projects.map(project => (
              <ArtifactCard
                key={project.slug}
                artifact={{ id: project.slug, name: project.name, icon: project.icon }}
                onSelect={() => handleProjectSelect(project.slug)}
                isEditMode={isEditMode}
                onEnterEditMode={enterEditMode}
                onDelete={() => handleDeleteProject(project.slug, project.name)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Floating Browser Window */}
      <PreviewWindow
        visible={browserWindowVisible}
        artifact={activeProject ? { id: activeProjectSlug, name: activeProject.name, icon: activeProject.icon } : null}
        files={files}
        loading={filesLoading}
        onClose={handleCloseBrowserWindow}
        onFileChange={onFileChange}
        onError={onError}
        onDebug={onDebug}
        onDebugNewChat={(debugInfo) => {
          // Navigate to chat first, then send the debug message
          navigate('/chat');
          // Call the debug handler which will send the message
          if (onDebugNewChat) {
            onDebugNewChat(debugInfo);
          }
        }}
        isDebugging={isDebugging}
        onIconChange={(iconId) => onIconChange?.(activeProjectSlug, iconId)}
        onRename={(newName) => onRename?.(activeProjectSlug, newName)}
        sidebarWidth={isSidebarExpanded ? 250 : 60}
      />

      {/* Settings Panel Modal */}
      <SettingsModal />

      {/* AppStore Panel Modal */}
      <AppStorePanel />

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
};

ComputerPage.propTypes = {
  files: PropTypes.object,
  onFileChange: PropTypes.func,
  onError: PropTypes.func,
  onDebug: PropTypes.func,
  onDebugNewChat: PropTypes.func,
  isDebugging: PropTypes.bool,
  onIconChange: PropTypes.func,
  onRename: PropTypes.func,
};

export default ComputerPage;
