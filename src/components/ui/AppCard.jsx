import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { getTheme } from "../../styles/theme";
import { createGlassEffect } from "../../styles/componentStyles";
import { useIsMobile } from "../../hooks/useIsMobile";
import { SIZES } from "../../constants";

// Delete button X icon
const DeleteIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * Reusable App Card component for the landing page grid
 * Used by ArtifactCard, SettingsAppCard, and ChatAppCard
 */
export const AppCard = ({
  icon: IconComponent,
  iconColor,
  label,
  onClick,
  multiLineLabel = false,
  isEditMode = false,
  onDelete,
  longPressHandlers = {},
}) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  const iconContainerSize = isMobile
    ? SIZES.APP_CARD.ICON_CONTAINER.mobile
    : SIZES.APP_CARD.ICON_CONTAINER.desktop;

  const iconSize = isMobile
    ? SIZES.APP_CARD.ICON.mobile
    : SIZES.APP_CARD.ICON.desktop;

  const fontSize = theme.typography.fontSize[
    isMobile ? SIZES.APP_CARD.FONT_SIZE.mobile : SIZES.APP_CARD.FONT_SIZE.desktop
  ];

  // Jiggle animation keyframes
  const jiggleAnimation = isEditMode ? "jiggle 0.3s ease-in-out infinite" : "none";

  // Handle click - either normal onClick or longPressHandlers
  const handleClick = onClick || longPressHandlers.onClick;

  return (
    <div
      onClick={!isEditMode ? handleClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={(e) => {
        setIsHovered(false);
        longPressHandlers.onMouseLeave?.(e);
      }}
      onMouseDown={longPressHandlers.onMouseDown}
      onMouseUp={longPressHandlers.onMouseUp}
      onTouchStart={longPressHandlers.onTouchStart}
      onTouchEnd={longPressHandlers.onTouchEnd}
      onTouchMove={longPressHandlers.onTouchMove}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: theme.spacing.sm,
        padding: isMobile ? theme.spacing.sm : theme.spacing.md,
        cursor: isEditMode ? "default" : "pointer",
        transition: isEditMode ? "none" : `transform ${theme.animation.fast}`,
        transform: isEditMode ? "none" : (isHovered ? "scale(1.05)" : "scale(1)"),
        animation: jiggleAnimation,
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {/* Delete Button - Shows in edit mode */}
      {isEditMode && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            position: "absolute",
            top: isMobile ? "0" : "4px",
            left: isMobile ? "8px" : "12px",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "#ff3b30",
            border: "2px solid #fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            padding: 0,
          }}
        >
          <DeleteIcon size={10} />
        </button>
      )}

      {/* App Icon - Liquid Glass Style */}
      <div style={{
        width: `${iconContainerSize}px`,
        height: `${iconContainerSize}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...createGlassEffect(theme),
        background: mode === "dark"
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(255, 255, 255, 0.65)",
        borderRadius: theme.radius["2.5xl"],
        boxShadow: isHovered && !isEditMode
          ? "0 8px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
          : "0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        transition: `all ${theme.animation.fast}`,
      }}>
        <IconComponent size={iconSize} color={iconColor} />
      </div>

      {/* Label */}
      <div style={{
        fontSize,
        fontWeight: theme.typography.fontWeight.semibold,
        fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif",
        letterSpacing: "-0.01em",
        color: theme.colors.text.primary,
        textAlign: "center",
        lineHeight: theme.typography.lineHeight.tight,
        ...(multiLineLabel && {
          wordBreak: "break-word",
          width: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }),
      }}>
        {label}
      </div>

      {/* Jiggle Animation Keyframes */}
      <style>
        {`
          @keyframes jiggle {
            0%, 100% { transform: rotate(-1.5deg); }
            50% { transform: rotate(1.5deg); }
          }
        `}
      </style>
    </div>
  );
};

export default AppCard;
