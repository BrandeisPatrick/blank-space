import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';

// Close icon component
const CloseIcon = ({ size = 24, color = '#6B7280' }) => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const SettingsPanel = () => {
  const { mode, theme: selectedTheme, setTheme, themePresets } = useTheme();
  const { isSettingsOpen, closeSettings } = useSettings();
  const theme = getTheme(mode);

  if (!isSettingsOpen) return null;

  const presetEntries = Object.entries(themePresets);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeSettings}
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

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '400px',
          ...createGlassEffect(theme),
          background: mode === 'dark'
            ? 'rgba(30, 30, 35, 0.75)'
            : 'rgba(255, 255, 255, 0.75)',
          borderRadius: theme.radius['2xl'],
          boxShadow: mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
            : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
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
          padding: theme.spacing.lg,
          borderBottom: mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            fontFamily: theme.typography.fontFamily.sans,
            color: theme.colors.text.primary,
          }}>
            Settings
          </h2>
          <button
            onClick={closeSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: 'transparent',
              border: 'none',
              borderRadius: theme.radius.full,
              cursor: 'pointer',
              transition: `background ${theme.animation.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <CloseIcon size={20} color={theme.colors.text.secondary} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: theme.spacing.lg }}>
          {/* Theme Section */}
          <div>
            <h3 style={{
              margin: `0 0 ${theme.spacing.md} 0`,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Theme
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: theme.spacing.md,
            }}>
              {presetEntries.map(([key, preset]) => {
                const isSelected = selectedTheme === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      padding: theme.spacing.sm,
                      background: 'transparent',
                      border: 'none',
                      borderRadius: theme.radius.lg,
                      cursor: 'pointer',
                      transition: `all ${theme.animation.fast}`,
                    }}
                  >
                    {/* Wallpaper preview */}
                    <div style={{
                      width: '100%',
                      aspectRatio: '16 / 10',
                      borderRadius: theme.radius.md,
                      background: preset.gradient || preset.backgroundColor,
                      border: isSelected
                        ? '2px solid #3B82F6'
                        : '1px solid rgba(0, 0, 0, 0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: `all ${theme.animation.fast}`,
                      boxShadow: isSelected
                        ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
                        : 'none',
                    }}>
                      {preset.variant === 'stars' ? (
                        /* Star preview */
                        <svg
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                          }}
                          viewBox="0 0 100 70"
                          preserveAspectRatio="xMidYMid slice"
                        >
                          {/* 4-point stars - use theme's starColors */}
                          <path d="M20,15 L21,18 L24,18 L21.5,20 L22.5,23 L20,21 L17.5,23 L18.5,20 L16,18 L19,18 Z" fill={preset.starColors?.[0] || '#4ADE80'} />
                          <path d="M75,45 L76,48 L79,48 L76.5,50 L77.5,53 L75,51 L72.5,53 L73.5,50 L71,48 L74,48 Z" fill={preset.starColors?.[2] || '#60A5FA'} />
                          <path d="M50,25 L51.5,29 L56,29 L52.5,32 L54,36 L50,33 L46,36 L47.5,32 L44,29 L48.5,29 Z" fill={preset.starColors?.[3] || '#F9A8D4'} />
                          {/* Small dots */}
                          <circle cx="85" cy="12" r="2" fill={preset.starColors?.[4] || '#A78BFA'} />
                          <circle cx="15" cy="55" r="2" fill={preset.starColors?.[5] || '#FCD34D'} />
                          <circle cx="60" cy="58" r="2" fill={preset.starColors?.[1] || '#67E8F9'} />
                          {/* Tiny sparkle */}
                          <path d="M35,45 L35.5,47 L37.5,47 L36,48.5 L36.5,50.5 L35,49 L33.5,50.5 L34,48.5 L32.5,47 L34.5,47 Z" fill={preset.starColors?.[3] || '#FBBF24'} />
                        </svg>
                      ) : (
                        /* Wave preview */
                        <svg
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                          }}
                          viewBox="0 0 100 70"
                          preserveAspectRatio="xMidYMid slice"
                        >
                          <path
                            d="M-10,60 Q20,45 40,55 T80,45 T120,50"
                            fill="none"
                            stroke={`rgba(255,255,255,${preset.waveOpacities[0]})`}
                            strokeWidth="8"
                          />
                          <path
                            d="M-10,45 Q25,30 50,40 T90,30 T120,35"
                            fill="none"
                            stroke={`rgba(255,255,255,${preset.waveOpacities[1]})`}
                            strokeWidth="8"
                          />
                          <path
                            d="M-10,30 Q30,15 55,25 T95,15 T120,20"
                            fill="none"
                            stroke={`rgba(255,255,255,${preset.waveOpacities[2]})`}
                            strokeWidth="8"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Name only */}
                    <span style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: isSelected ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                      fontFamily: theme.typography.fontFamily.sans,
                      color: isSelected ? '#3B82F6' : theme.colors.text.primary,
                    }}>
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
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

export default SettingsPanel;
