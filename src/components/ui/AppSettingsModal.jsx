import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { IconPicker } from '../artifact/IconPicker';
import { XIcon } from '../icons';
import { useIsMobile } from '../../hooks/useIsMobile';

export const AppSettingsModal = ({
  isOpen,
  onClose,
  name,
  icon,
  onNameChange,
  onIconChange
}) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const isMobile = useIsMobile();
  const [editedName, setEditedName] = useState(name || '');

  // Sync editedName when name prop changes
  useEffect(() => {
    setEditedName(name || '');
  }, [name]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (editedName.trim() && editedName.trim() !== name) {
      onNameChange?.(editedName.trim());
    }
    onClose();
  };

  const handleIconSelect = (iconId) => {
    onIconChange?.(iconId);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? '100%' : '95%',
          maxWidth: isMobile ? '100%' : '900px',
          maxHeight: '85vh',
          ...createGlassEffect(theme),
          background: mode === 'dark'
            ? 'rgba(30, 30, 35, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
          borderRadius: theme.radius['2xl'],
          boxShadow: mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          zIndex: 1000,
          animation: 'slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing.md,
          borderBottom: mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}>
          <h3 style={{
            margin: 0,
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            fontFamily: theme.typography.fontFamily.sans,
            color: theme.colors.text.primary,
          }}>
            App Settings
          </h3>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: 'none',
              borderRadius: theme.radius.full,
              cursor: 'pointer',
              transition: `background ${theme.animation.fast}`,
            }}
          >
            <XIcon size={18} color={theme.colors.text.secondary} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: theme.spacing.md }}>
          {/* Name Input */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <label style={{
              display: 'block',
              marginBottom: theme.spacing.xs,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.secondary,
            }}>
              Name
            </label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') onClose();
              }}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                fontSize: theme.typography.fontSize.base,
                fontFamily: theme.typography.fontFamily.sans,
                color: theme.colors.text.primary,
                background: mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)',
                border: mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.15)'
                  : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: theme.radius.md,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Icon Picker */}
          <div style={{ marginBottom: theme.spacing.md }}>
            <label style={{
              display: 'block',
              marginBottom: theme.spacing.xs,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.secondary,
            }}>
              Icon
            </label>
            <IconPicker
              currentIcon={icon}
              onSelect={handleIconSelect}
              onClose={() => {}} // Keep picker open in modal
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: theme.spacing.md,
          borderTop: mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}>
          <button
            onClick={handleSave}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: '#fff',
              background: theme.colors.accent,
              border: 'none',
              borderRadius: theme.radius.md,
              cursor: 'pointer',
              transition: `all ${theme.animation.fast}`,
            }}
          >
            Done
          </button>
        </div>

        {/* Animations */}
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translate(-50%, -48%) scale(0.98);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
            }
          `}
        </style>
      </div>
    </>
  );
};

export default AppSettingsModal;
