// Particle Visualizer - Interactive particle system with customization
export const particles = {
  name: "Particle Visualizer",
  files: {
    "App.jsx": `import { useState } from "react";
import ParticleCanvas from "./components/ParticleCanvas";
import ControlPanel from "./components/ControlPanel";

export default function App() {
  const [config, setConfig] = useState({
    particleCount: 100,
    particleSize: 3,
    particleColor: "#60a5fa",
    backgroundColor: "#0f172a",
    speed: 1,
    connectionDistance: 150,
    mouseInteraction: true,
    showConnections: true,
  });

  const [showControls, setShowControls] = useState(true);

  const presets = [
    {
      name: "Default",
      config: {
        particleCount: 100,
        particleSize: 3,
        particleColor: "#60a5fa",
        backgroundColor: "#0f172a",
        speed: 1,
        connectionDistance: 150,
        mouseInteraction: true,
        showConnections: true,
      }
    },
    {
      name: "Starfield",
      config: {
        particleCount: 200,
        particleSize: 2,
        particleColor: "#ffffff",
        backgroundColor: "#000000",
        speed: 2,
        connectionDistance: 0,
        mouseInteraction: false,
        showConnections: false,
      }
    },
    {
      name: "Aurora",
      config: {
        particleCount: 80,
        particleSize: 5,
        particleColor: "#a78bfa",
        backgroundColor: "#1e1b4b",
        speed: 0.5,
        connectionDistance: 200,
        mouseInteraction: true,
        showConnections: true,
      }
    },
    {
      name: "Neon",
      config: {
        particleCount: 150,
        particleSize: 4,
        particleColor: "#22d3ee",
        backgroundColor: "#0c0a09",
        speed: 1.5,
        connectionDistance: 120,
        mouseInteraction: true,
        showConnections: true,
      }
    }
  ];

  const updateConfig = (updates) => {
    setConfig({ ...config, ...updates });
  };

  const loadPreset = (preset) => {
    setConfig(preset.config);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: config.backgroundColor }}>
      <ParticleCanvas config={config} />

      {/* Toggle Button */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute top-4 right-4 z-20 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition"
      >
        {showControls ? "Hide Controls" : "Show Controls"}
      </button>

      {/* Control Panel */}
      {showControls && (
        <ControlPanel
          config={config}
          onUpdateConfig={updateConfig}
          presets={presets}
          onLoadPreset={loadPreset}
        />
      )}

      {/* Info Overlay */}
      <div className="absolute bottom-4 left-4 text-white/70 text-sm">
        <p>Move your mouse to interact with particles</p>
        <p className="text-xs mt-1">Particles: {config.particleCount}</p>
      </div>
    </div>
  );
}`,

    "components/ParticleCanvas.jsx": `import { useEffect, useRef } from "react";

export default function ParticleCanvas({ config }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null });
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * config.speed;
        this.vy = (Math.random() - 0.5) * config.speed;
        this.size = config.particleSize;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Mouse interaction
        if (config.mouseInteraction && mouseRef.current.x !== null) {
          const dx = mouseRef.current.x - this.x;
          const dy = mouseRef.current.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            const force = (100 - distance) / 100;
            this.x -= (dx / distance) * force * 2;
            this.y -= (dy / distance) * force * 2;
          }
        }
      }

      draw() {
        ctx.fillStyle = config.particleColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize particles
    particlesRef.current = Array.from({ length: config.particleCount }, () => new Particle());

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, i) => {
        particle.update();
        particle.draw();

        // Draw connections
        if (config.showConnections && config.connectionDistance > 0) {
          particlesRef.current.slice(i + 1).forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.connectionDistance) {
              const opacity = 1 - distance / config.connectionDistance;
              ctx.strokeStyle = \`\${config.particleColor}\${Math.floor(opacity * 255).toString(16).padStart(2, '0')}\`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
            }
          });
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Mouse move handler
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, [config]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}`,

    "components/ControlPanel.jsx": `export default function ControlPanel({ config, onUpdateConfig, presets, onLoadPreset }) {
  return (
    <div className="absolute top-4 left-4 z-10 w-80 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-white shadow-2xl">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Particle Controls
      </h2>

      {/* Presets */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Presets</label>
        <div className="grid grid-cols-2 gap-2">
          {presets.map(preset => (
            <button
              key={preset.name}
              onClick={() => onLoadPreset(preset)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition border border-white/10"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Particle Count */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Particle Count: {config.particleCount}
        </label>
        <input
          type="range"
          min="10"
          max="300"
          value={config.particleCount}
          onChange={(e) => onUpdateConfig({ particleCount: parseInt(e.target.value) })}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Particle Size */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Particle Size: {config.particleSize}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={config.particleSize}
          onChange={(e) => onUpdateConfig({ particleSize: parseInt(e.target.value) })}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Speed */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Speed: {config.speed.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={config.speed}
          onChange={(e) => onUpdateConfig({ speed: parseFloat(e.target.value) })}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Connection Distance */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Connection Distance: {config.connectionDistance}
        </label>
        <input
          type="range"
          min="0"
          max="300"
          value={config.connectionDistance}
          onChange={(e) => onUpdateConfig({ connectionDistance: parseInt(e.target.value) })}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Particle Color */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Particle Color
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={config.particleColor}
            onChange={(e) => onUpdateConfig({ particleColor: e.target.value })}
            className="w-12 h-10 rounded-lg cursor-pointer"
          />
          <span className="text-xs font-mono">{config.particleColor}</span>
        </div>
      </div>

      {/* Background Color */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Background Color
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={config.backgroundColor}
            onChange={(e) => onUpdateConfig({ backgroundColor: e.target.value })}
            className="w-12 h-10 rounded-lg cursor-pointer"
          />
          <span className="text-xs font-mono">{config.backgroundColor}</span>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium">Mouse Interaction</span>
          <input
            type="checkbox"
            checked={config.mouseInteraction}
            onChange={(e) => onUpdateConfig({ mouseInteraction: e.target.checked })}
            className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium">Show Connections</span>
          <input
            type="checkbox"
            checked={config.showConnections}
            onChange={(e) => onUpdateConfig({ showConnections: e.target.checked })}
            className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}`
  }
};
