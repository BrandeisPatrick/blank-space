import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import {
  AppIcon,
  ChecklistIcon,
  GamepadIcon,
  GlobeIcon,
  SearchIcon,
  ChartIcon,
  UsersIcon
} from '../icons';

// Icon category definitions
export const ICON_CATEGORIES = [
  { id: 'app', name: 'App', Icon: AppIcon },
  { id: 'productivity', name: 'Productivity', Icon: ChecklistIcon },
  { id: 'game', name: 'Game', Icon: GamepadIcon },
  { id: 'website', name: 'Website', Icon: GlobeIcon },
  { id: 'research', name: 'Research', Icon: SearchIcon },
  { id: 'dashboard', name: 'Dashboard', Icon: ChartIcon },
  { id: 'social', name: 'Social', Icon: UsersIcon },
];

// Helper to get icon component by id
export const getIconById = (iconId) => {
  const category = ICON_CATEGORIES.find(c => c.id === iconId);
  return category?.Icon || AppIcon;
};

export const IconPicker = ({ currentIcon = 'app', onSelect, onClose }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const pickerRef = useRef(null);
  const [hoveredIcon, setHoveredIcon] = useState(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  const handleSelect = (iconId) => {
    onSelect?.(iconId);
    onClose?.();
  };

  return (
    <div
      ref={pickerRef}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: theme.spacing.sm,
        background: theme.colors.bg.secondary,
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadows.lg,
        padding: theme.spacing.md,
        zIndex: 100,
        minWidth: '180px',
      }}
    >
      {/* Grid of icons - 4 per row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: theme.spacing.sm,
      }}>
        {ICON_CATEGORIES.map(({ id, name, Icon }) => {
          const isSelected = currentIcon === id;
          const isHovered = hoveredIcon === id;

          return (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              onMouseEnter={() => setHoveredIcon(id)}
              onMouseLeave={() => setHoveredIcon(null)}
              title={name}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isSelected
                  ? theme.colors.bg.tertiary
                  : isHovered
                    ? theme.colors.bg.primary
                    : 'transparent',
                border: isSelected
                  ? `2px solid ${theme.colors.text.secondary}`
                  : '2px solid transparent',
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                transition: `all ${theme.animation.fast}`,
              }}
            >
              <Icon
                size={24}
                color={isSelected ? theme.colors.text.primary : theme.colors.text.secondary}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
