/**
 * File Explorer Modal
 * macOS Finder-style column view file browser in a modal
 */

import { useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { Z_INDEX } from '../../constants';
import {
  createModalBackdropStyle,
  createModalPanelStyle,
  MODAL_ANIMATIONS,
} from '../../styles/componentStyles';
import FileExplorer from './FileExplorer';

// Close icon
const CloseIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const FileExplorerModal = ({ isOpen, onClose }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle upload trigger from FileExplorer
  const handleUpload = useCallback((targetPath) => {
    // Store target path for the file input
    if (fileInputRef.current) {
      fileInputRef.current.dataset.targetPath = targetPath;
      fileInputRef.current.click();
    }
  }, []);

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={createModalBackdropStyle(Z_INDEX.MODAL_BACKDROP)}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        style={{
          ...createModalPanelStyle(theme, Z_INDEX.MODALS),
          width: '90%',
          maxWidth: '900px',
          height: '70vh',
          maxHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: theme.spacing.md,
            borderBottom: `1px solid ${theme.colors.border}`,
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.medium,
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.primary,
            }}
          >
            Files
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: theme.colors.text.secondary,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.bg.tertiary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* File Explorer */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <FileExplorer expanded onUpload={handleUpload} />
        </div>

        {/* Hidden file input for uploads */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            const targetPath = e.target.dataset.targetPath || '/';
            if (file) {
              // Import FileSystemContext dynamically to avoid circular deps
              const { useFileSystem } = await import('../../contexts/FileSystemContext');
              // This won't work directly - we'll handle upload differently
              console.log('Upload file:', file.name, 'to:', targetPath);
            }
            e.target.value = '';
          }}
        />

        {/* Animations */}
        <style>{MODAL_ANIMATIONS}</style>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

FileExplorerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FileExplorerModal;
