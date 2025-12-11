/**
 * Space Station - Isometric Scene Demo
 * An interactive isometric space station built with Kenney's Space Station Kit
 */

export const spaceStationArtifact = {
  id: 'space-station',
  name: 'Space Station',
  description: 'An interactive isometric space station scene. Click tiles to place props.',
  icon: 'game',
  category: 'games',
  files: {
    'App.jsx': `
const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;
const GRID_SIZE = 8;

const ASSET_BASE = '/kenney_space-station-kit/Previews';

const FLOOR_TILES = ['floor.png', 'floor-detail.png', 'floor-panel.png'];

const PROPS = [
  { id: 'chair', name: 'Chair', file: 'chair.png' },
  { id: 'table', name: 'Table', file: 'table.png' },
  { id: 'computer', name: 'Computer', file: 'computer.png' },
  { id: 'bed', name: 'Bed', file: 'bed-single.png' },
  { id: 'container', name: 'Container', file: 'container.png' },
];

// Convert grid coordinates to isometric screen position
const gridToIso = (gridX, gridY) => {
  const screenX = (gridX - gridY) * (TILE_WIDTH / 2);
  const screenY = (gridX + gridY) * (TILE_HEIGHT / 2);
  return { x: screenX, y: screenY };
};

// Tile component
const Tile = ({ gridX, gridY, floorType, prop, isHovered, onClick, onHover }) => {
  const pos = gridToIso(gridX, gridY);
  const zIndex = gridX + gridY;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        position: 'absolute',
        left: pos.x + 'px',
        top: pos.y + 'px',
        width: TILE_WIDTH + 'px',
        height: TILE_WIDTH + 'px',
        zIndex: zIndex,
        cursor: 'pointer',
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Floor tile */}
      <img
        src={\`\${ASSET_BASE}/\${floorType}\`}
        alt="floor"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: isHovered ? 'brightness(1.3)' : 'brightness(1)',
          transition: 'filter 0.15s ease',
        }}
        draggable={false}
      />

      {/* Prop on tile */}
      {prop && (
        <img
          src={\`\${ASSET_BASE}/\${prop.file}\`}
          alt={prop.name}
          style={{
            position: 'absolute',
            left: '50%',
            top: '25%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '80%',
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      )}

      {/* Hover highlight */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 180, 100, 0.2)',
          borderRadius: '4px',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
};

// Prop selector toolbar
const PropSelector = ({ selectedProp, onSelect, onClear }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '12px',
      background: 'rgba(30, 30, 40, 0.9)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      flexWrap: 'wrap',
      justifyContent: 'center',
    }}>
      <button
        onClick={onClear}
        style={{
          padding: '8px 12px',
          background: selectedProp === null ? 'rgba(220, 80, 80, 0.6)' : 'rgba(60, 60, 70, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '6px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        Eraser
      </button>
      {PROPS.map(prop => (
        <button
          key={prop.id}
          onClick={() => onSelect(prop)}
          style={{
            padding: '8px 12px',
            background: selectedProp?.id === prop.id ? 'rgba(100, 180, 255, 0.6)' : 'rgba(60, 60, 70, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <img
            src={\`\${ASSET_BASE}/\${prop.file}\`}
            alt={prop.name}
            style={{ width: '20px', height: '20px', objectFit: 'contain' }}
          />
          {prop.name}
        </button>
      ))}
    </div>
  );
};

function App() {
  const [hoveredTile, setHoveredTile] = useState(null);
  const [selectedProp, setSelectedProp] = useState(PROPS[0]);
  const [placedProps, setPlacedProps] = useState({});
  const [floorPattern, setFloorPattern] = useState({});

  // Initialize floor pattern
  useEffect(() => {
    const pattern = {};
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const key = \`\${x},\${y}\`;
        // Create a nice pattern
        if ((x + y) % 3 === 0) {
          pattern[key] = 'floor-detail.png';
        } else if ((x + y) % 5 === 0) {
          pattern[key] = 'floor-panel.png';
        } else {
          pattern[key] = 'floor.png';
        }
      }
    }
    setFloorPattern(pattern);
  }, []);

  const handleTileClick = (x, y) => {
    const key = \`\${x},\${y}\`;
    if (selectedProp === null) {
      // Eraser mode - remove prop
      setPlacedProps(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      // Place prop
      setPlacedProps(prev => ({
        ...prev,
        [key]: selectedProp
      }));
    }
  };

  // Calculate center offset for the grid
  const centerOffsetX = (GRID_SIZE * TILE_WIDTH) / 2;
  const centerOffsetY = TILE_HEIGHT;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
      fontFamily: 'monospace',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#f4a460',
          letterSpacing: '2px',
        }}>
          SPACE STATION
        </h1>
        <p style={{
          margin: '4px 0 0',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.5)',
        }}>
          Click tiles to place objects
        </p>
      </div>

      {/* Prop selector */}
      <PropSelector
        selectedProp={selectedProp}
        onSelect={setSelectedProp}
        onClear={() => setSelectedProp(null)}
      />

      {/* Isometric grid container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'relative',
          width: GRID_SIZE * TILE_WIDTH + 'px',
          height: GRID_SIZE * TILE_HEIGHT * 2 + 'px',
          transform: 'translateY(-20px)',
        }}>
          {/* Offset container to center the isometric grid */}
          <div style={{
            position: 'absolute',
            left: centerOffsetX + 'px',
            top: centerOffsetY + 'px',
          }}>
            {/* Render tiles from back to front for proper depth */}
            {Array.from({ length: GRID_SIZE }).map((_, y) =>
              Array.from({ length: GRID_SIZE }).map((_, x) => {
                const key = \`\${x},\${y}\`;
                const isHovered = hoveredTile === key;
                return (
                  <Tile
                    key={key}
                    gridX={x}
                    gridY={y}
                    floorType={floorPattern[key] || 'floor.png'}
                    prop={placedProps[key]}
                    isHovered={isHovered}
                    onClick={() => handleTileClick(x, y)}
                    onHover={(hovered) => setHoveredTile(hovered ? key : null)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '10px',
        textAlign: 'center',
      }}>
        Assets: Kenney Space Station Kit (CC0)
      </div>
    </div>
  );
}
`,
    'styles.css': `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  overflow: hidden;
  background: #1a1a2e;
}

button:hover {
  filter: brightness(1.1);
}

button:active {
  transform: scale(0.98);
}
`
  }
};
