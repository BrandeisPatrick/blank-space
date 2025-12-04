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

// Icon category definitions with unique colors
export const ICON_CATEGORIES = [
  { id: 'app', name: 'App', Icon: AppIcon, color: '#6366f1' },           // Indigo
  { id: 'productivity', name: 'Productivity', Icon: ChecklistIcon, color: '#22c55e' }, // Green
  { id: 'game', name: 'Game', Icon: GamepadIcon, color: '#f43f5e' },     // Rose
  { id: 'website', name: 'Website', Icon: GlobeIcon, color: '#3b82f6' }, // Blue
  { id: 'research', name: 'Research', Icon: SearchIcon, color: '#f59e0b' }, // Amber
  { id: 'dashboard', name: 'Dashboard', Icon: ChartIcon, color: '#8b5cf6' }, // Purple
  { id: 'social', name: 'Social', Icon: UsersIcon, color: '#ec4899' },   // Pink
];

// Helper to get icon component and color by id
export const getIconById = (iconId) => {
  const category = ICON_CATEGORIES.find(c => c.id === iconId);
  return category?.Icon || AppIcon;
};

// Helper to get icon color by id
export const getIconColorById = (iconId) => {
  const category = ICON_CATEGORIES.find(c => c.id === iconId);
  return category?.color || '#6366f1';
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
        background: theme.colors.bg.secondary,
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadows.lg,
        padding: theme.spacing.md,
        minWidth: '180px',
      }}
    >
      {/* Grid of icons - 4 per row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: theme.spacing.sm,
      }}>
        {ICON_CATEGORIES.map(({ id, name, Icon, color }) => {
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
                  ? `${color}15`
                  : isHovered
                    ? theme.colors.bg.primary
                    : 'transparent',
                border: isSelected
                  ? `2px solid ${color}`
                  : '2px solid transparent',
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                transition: `all ${theme.animation.fast}`,
              }}
            >
              <Icon
                size={24}
                color={color}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
