/**
 * BackgroundWaves
 * Main wrapper component for background wave decorations
 * Supports different wave variants and presets
 */

import { DiagonalWaves } from './waves';
import { wallpaperPresets } from './presets';

export const BackgroundWaves = ({
  variant = 'diagonal',
  preset = 'landing',
  opacities = null,
}) => {
  // Get opacities from preset if not explicitly provided
  const finalOpacities = opacities || wallpaperPresets[preset]?.waveOpacities;

  const renderWaves = () => {
    switch (variant) {
      case 'diagonal':
        return <DiagonalWaves opacities={finalOpacities} />;
      default:
        return <DiagonalWaves opacities={finalOpacities} />;
    }
  };

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Diagonal parallel waves with random width variations */}
      {renderWaves()}
    </svg>
  );
};
