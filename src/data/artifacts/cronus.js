/**
 * Cronus Artifact
 * An interactive 3D Saturn particle system built with Three.js
 */

export const cronusArtifact = {
  id: 'cronus',
  name: 'Cronus',
  description: 'An interactive 3D Saturn particle system. Pinch to zoom, drag to rotate.',
  icon: 'game',
  files: {
    'App.jsx': `// Cronus - Saturn Particle System
// Interactive 3D visualization with Three.js

function App() {
  const containerRef = useRef(null);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(50); // 0-100 percent
  const sceneRef = useRef(null);
  const zoomRef = useRef({ target: 15, current: 15 });

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load Three.js dynamically
  useEffect(() => {
    if (window.THREE) {
      setThreeLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = () => {
      setThreeLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Three.js');
    };
    document.head.appendChild(script);

    return () => {};
  }, []);

  // Zoom handlers for buttons
  const zoomIntervalRef = useRef(null);

  const handleZoomIn = () => {
    const minZoom = 0.5;  // Can fly into the core!
    const maxZoom = 35;
    zoomRef.current.target = Math.max(minZoom, zoomRef.current.target - 1.5);
    const percent = 100 - ((zoomRef.current.target - minZoom) / (maxZoom - minZoom)) * 100;
    setZoomLevel(Math.round(percent));
  };

  const handleZoomOut = () => {
    const minZoom = 0.5;
    const maxZoom = 35;
    zoomRef.current.target = Math.min(maxZoom, zoomRef.current.target + 1.5);
    const percent = 100 - ((zoomRef.current.target - minZoom) / (maxZoom - minZoom)) * 100;
    setZoomLevel(Math.round(percent));
  };

  // Start continuous zoom on hold
  const startZoomIn = () => {
    handleZoomIn();
    zoomIntervalRef.current = setInterval(handleZoomIn, 100);
  };

  const startZoomOut = () => {
    handleZoomOut();
    zoomIntervalRef.current = setInterval(handleZoomOut, 100);
  };

  const stopZoom = () => {
    if (zoomIntervalRef.current) {
      clearInterval(zoomIntervalRef.current);
      zoomIntervalRef.current = null;
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (zoomIntervalRef.current) {
        clearInterval(zoomIntervalRef.current);
      }
    };
  }, []);

  // Initialize Three.js scene once loaded
  useEffect(() => {
    if (!threeLoaded || !containerRef.current || sceneRef.current) return;

    const THREE = window.THREE;
    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Store refs for cleanup
    sceneRef.current = { scene, camera, renderer };

    // Particle system parameters - match original high density
    const particleCount = 100000;
    const ringParticleCount = 50000;

    // Create planet particles (sphere)
    const planetGeometry = new THREE.BufferGeometry();
    const planetPositions = new Float32Array(particleCount * 3);
    const planetColors = new Float32Array(particleCount * 3);
    const planetSizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 3 + Math.random() * 0.3;

      planetPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      planetPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      planetPositions[i * 3 + 2] = radius * Math.cos(phi);

      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        planetColors[i * 3] = 0.9 + Math.random() * 0.1;
        planetColors[i * 3 + 1] = 0.7 + Math.random() * 0.2;
        planetColors[i * 3 + 2] = 0.3 + Math.random() * 0.2;
      } else if (colorChoice < 0.7) {
        planetColors[i * 3] = 0.8 + Math.random() * 0.2;
        planetColors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
        planetColors[i * 3 + 2] = 0.2 + Math.random() * 0.1;
      } else {
        planetColors[i * 3] = 0.7 + Math.random() * 0.3;
        planetColors[i * 3 + 1] = 0.4 + Math.random() * 0.2;
        planetColors[i * 3 + 2] = 0.1 + Math.random() * 0.1;
      }

      planetSizes[i] = 0.02 + Math.random() * 0.03;
    }

    planetGeometry.setAttribute('position', new THREE.BufferAttribute(planetPositions, 3));
    planetGeometry.setAttribute('color', new THREE.BufferAttribute(planetColors, 3));
    planetGeometry.setAttribute('size', new THREE.BufferAttribute(planetSizes, 1));

    const planetMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const planet = new THREE.Points(planetGeometry, planetMaterial);
    scene.add(planet);

    // Create multiple ring bands (like Saturn's A, B, C, D rings)
    const ringBands = [
      { inner: 3.8, outer: 4.3, particles: 15000, opacity: 0.5, color: [0.6, 0.55, 0.45] },  // D ring (faint inner)
      { inner: 4.5, outer: 5.5, particles: 25000, opacity: 0.8, color: [0.85, 0.8, 0.65] },  // C ring
      { inner: 5.7, outer: 7.0, particles: 35000, opacity: 0.9, color: [0.95, 0.9, 0.75] },  // B ring (brightest)
      { inner: 7.3, outer: 8.5, particles: 30000, opacity: 0.85, color: [0.9, 0.85, 0.7] },  // A ring
      { inner: 9.0, outer: 9.5, particles: 8000, opacity: 0.4, color: [0.5, 0.48, 0.4] },    // F ring (thin outer)
    ];

    const allRings = [];
    let totalRingParticles = 0;

    ringBands.forEach((band, bandIndex) => {
      const ringGeometry = new THREE.BufferGeometry();
      const ringPositions = new Float32Array(band.particles * 3);
      const ringColors = new Float32Array(band.particles * 3);

      for (let i = 0; i < band.particles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = band.inner + Math.random() * (band.outer - band.inner);
        const yOffset = (Math.random() - 0.5) * 0.15;

        ringPositions[i * 3] = radius * Math.cos(angle);
        ringPositions[i * 3 + 1] = yOffset;
        ringPositions[i * 3 + 2] = radius * Math.sin(angle);

        const brightness = 0.7 + Math.random() * 0.3;
        ringColors[i * 3] = brightness * band.color[0];
        ringColors[i * 3 + 1] = brightness * band.color[1];
        ringColors[i * 3 + 2] = brightness * band.color[2];
      }

      ringGeometry.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
      ringGeometry.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));

      const ringMaterial = new THREE.PointsMaterial({
        size: 0.025,
        vertexColors: true,
        transparent: true,
        opacity: band.opacity,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
      });

      const ring = new THREE.Points(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI * 0.4;
      ring.userData = { bandIndex, baseRotation: Math.PI * 0.4 };
      scene.add(ring);
      allRings.push({ mesh: ring, geometry: ringGeometry, material: ringMaterial, speed: 0.001 + bandIndex * 0.0005 });
      totalRingParticles += band.particles;
    });

    // Interaction state - allow flying into the core
    const minZoom = 0.5;  // Can fly inside the planet!
    const maxZoom = 35;
    let rotationX = 0;
    let rotationY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let autoRotate = true;

    // Touch state for gestures
    let touchStartDistance = 0;
    let touchStartZoom = 15;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let isDragging = false;

    const updateZoomLevel = () => {
      const percent = 100 - ((zoomRef.current.target - minZoom) / (maxZoom - minZoom)) * 100;
      setZoomLevel(Math.round(percent));
    };

    // Keyboard controls
    const handleKeyDown = (e) => {
      if (e.key === 'w' || e.key === 'W') {
        zoomRef.current.target = Math.max(minZoom, zoomRef.current.target - 1);
        updateZoomLevel();
      } else if (e.key === 's' || e.key === 'S') {
        zoomRef.current.target = Math.min(maxZoom, zoomRef.current.target + 1);
        updateZoomLevel();
      }
    };

    // Mouse wheel zoom
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1;
      zoomRef.current.target = Math.max(minZoom, Math.min(maxZoom, zoomRef.current.target + delta));
      updateZoomLevel();
    };

    // Mouse drag to rotate
    const handleMouseDown = (e) => {
      isDragging = true;
      autoRotate = false;
      lastTouchX = e.clientX;
      lastTouchY = e.clientY;
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - lastTouchX;
      const deltaY = e.clientY - lastTouchY;
      targetRotationY += deltaX * 0.005;
      targetRotationX += deltaY * 0.005;
      targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationX));
      lastTouchX = e.clientX;
      lastTouchY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
      setTimeout(() => { autoRotate = true; }, 2000);
    };

    // Touch handlers for mobile
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistance = Math.sqrt(dx * dx + dy * dy);
        touchStartZoom = zoomRef.current.target;
      } else if (e.touches.length === 1) {
        isDragging = true;
        autoRotate = false;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = touchStartDistance / distance;
        zoomRef.current.target = Math.max(minZoom, Math.min(maxZoom, touchStartZoom * scale));
        updateZoomLevel();
      } else if (e.touches.length === 1 && isDragging) {
        const deltaX = e.touches[0].clientX - lastTouchX;
        const deltaY = e.touches[0].clientY - lastTouchY;
        targetRotationY += deltaX * 0.008;
        targetRotationX += deltaY * 0.008;
        targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationX));
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
      touchStartDistance = 0;
      setTimeout(() => { autoRotate = true; }, 2000);
    };

    // Event listeners - attach touch events to canvas element only (not container)
    // This allows UI buttons to receive touch events
    window.addEventListener('keydown', handleKeyDown);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', handleTouchEnd);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Smooth zoom
      zoomRef.current.current += (zoomRef.current.target - zoomRef.current.current) * 0.05;
      camera.position.z = zoomRef.current.current;

      // Smooth rotation
      rotationX += (targetRotationX - rotationX) * 0.1;
      rotationY += (targetRotationY - rotationY) * 0.1;

      // Auto-rotate when not interacting - FASTER
      if (autoRotate) {
        targetRotationY += 0.006;
      }

      // Apply rotation to planet
      planet.rotation.x = rotationX;
      planet.rotation.y = rotationY;

      // Rotate each ring band at different speeds (inner rings faster)
      allRings.forEach((ringData, i) => {
        ringData.mesh.rotation.x = Math.PI * 0.4 + rotationX;
        ringData.mesh.rotation.z = rotationY * (0.3 + i * 0.15);
      });

      renderer.render(scene, camera);
    };

    animate();
    setLoading(false);

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      renderer.domElement.removeEventListener('touchmove', handleTouchMove);
      renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      planetGeometry.dispose();
      planetMaterial.dispose();
      allRings.forEach(ringData => {
        ringData.geometry.dispose();
        ringData.material.dispose();
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, [threeLoaded]);

  const buttonStyle = {
    width: isMobile ? '60px' : '44px',
    height: isMobile ? '48px' : '32px',
    borderRadius: '8px',
    border: '2px solid rgba(255, 255, 255, 0.4)',
    background: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    fontSize: isMobile ? '13px' : '10px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none',
    outline: 'none',
    minWidth: isMobile ? '60px' : '44px',
    minHeight: isMobile ? '48px' : '32px'
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />

      {/* Loading state */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#fff',
          fontFamily: 'monospace',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '10px' }}>Loading Cronus...</div>
          <div style={{ width: '100px', height: '2px', background: '#333', borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{
              width: '30%',
              height: '100%',
              background: '#f4a460',
              animation: 'loadingBar 1s ease-in-out infinite'
            }} />
          </div>
        </div>
      )}

      {/* HUD Overlay - responsive */}
      {!loading && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '12px' : '20px',
          left: isMobile ? '12px' : '20px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontFamily: 'monospace',
          fontSize: isMobile ? '10px' : '12px',
          pointerEvents: 'none',
          userSelect: 'none'
        }}>
          <div style={{ marginBottom: isMobile ? '4px' : '8px', color: '#f4a460', fontSize: isMobile ? '14px' : '16px', fontWeight: 'bold' }}>
            CRONUS
          </div>
          {!isMobile && (
            <div style={{ marginBottom: '4px' }}>
              Saturn Particle System
            </div>
          )}
        </div>
      )}

      {/* Zoom Controls - Right side */}
      {!loading && (
        <div style={{
          position: 'absolute',
          right: isMobile ? '16px' : '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isMobile ? '16px' : '10px',
          zIndex: 1000,
          pointerEvents: 'auto',
          touchAction: 'auto'
        }}>
          {/* PUSH Button (Zoom In) */}
          <button
            onClick={handleZoomIn}
            onMouseDown={startZoomIn}
            onMouseUp={stopZoom}
            onMouseLeave={(e) => {
              stopZoom();
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            }}
            onTouchStart={() => startZoomIn()}
            onTouchEnd={() => stopZoom()}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(244, 164, 96, 0.4)';
              e.currentTarget.style.borderColor = '#f4a460';
            }}
          >
            PUSH
          </button>

          {/* Throttle Progress Bar */}
          <div style={{
            width: '6px',
            height: isMobile ? '140px' : '120px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: zoomLevel + '%',
              background: 'linear-gradient(to top, #f4a460, #ffd700)',
              borderRadius: '2px',
              transition: 'height 0.1s ease-out',
              boxShadow: '0 0 8px rgba(244, 164, 96, 0.5)'
            }} />
          </div>

          {/* BACK Button (Zoom Out) */}
          <button
            onClick={handleZoomOut}
            onMouseDown={startZoomOut}
            onMouseUp={stopZoom}
            onMouseLeave={(e) => {
              stopZoom();
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            }}
            onTouchStart={() => startZoomOut()}
            onTouchEnd={() => stopZoom()}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(244, 164, 96, 0.4)';
              e.currentTarget.style.borderColor = '#f4a460';
            }}
          >
            BACK
          </button>

          {/* Throttle label */}
          <div style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontFamily: 'monospace',
            fontSize: isMobile ? '8px' : '7px',
            marginTop: '4px',
            letterSpacing: '1px'
          }}>
            THROTTLE
          </div>
        </div>
      )}

      {/* Stats - Bottom left */}
      {!loading && (
        <div style={{
          position: 'absolute',
          bottom: isMobile ? '12px' : '20px',
          left: isMobile ? '12px' : '20px',
          color: 'rgba(255, 255, 255, 0.4)',
          fontFamily: 'monospace',
          fontSize: isMobile ? '8px' : '10px',
          pointerEvents: 'none'
        }}>
          <div>PARTICLES: 213,000</div>
          <div>RINGS: 5 BANDS</div>
          <div style={{ marginTop: '8px', opacity: 0.6, fontSize: isMobile ? '7px' : '9px' }}>
            {isMobile ? 'Drag to rotate' : '[W/S] Zoom • Drag to rotate'}
          </div>
        </div>
      )}

      <style>{\`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(250%); }
          100% { transform: translateX(-100%); }
        }
        button:active {
          transform: scale(0.95);
        }
      \`}</style>
    </div>
  );
}
`,
    'styles.css': `/* Cronus Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #000;
  touch-action: none;
}

canvas {
  display: block;
  touch-action: none;
}
`
  }
};
