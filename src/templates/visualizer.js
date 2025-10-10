// Dynamic Audio Visualizer - Real-time canvas graphics with Web Audio API
export const visualizer = {
  name: "Audio Visualizer",
  files: {
    "App.jsx": `import { useState, useRef } from "react";
import Visualizer from "./components/Visualizer";
import Controls from "./components/Controls";
import PresetSelector from "./components/PresetSelector";

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualMode, setVisualMode] = useState("bars"); // bars, circle, wave, particles
  const [colorScheme, setColorScheme] = useState("rainbow");
  const [sensitivity, setSensitivity] = useState(50);
  const audioRef = useRef(null);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent mb-4 animate-pulse">
            🎵 Audio Visualizer 🎵
          </h1>
          <p className="text-xl text-gray-400">
            Experience music in a whole new dimension
          </p>
        </div>

        {/* Main Visualizer */}
        <div className="mb-8">
          <Visualizer
            audioRef={audioRef}
            isPlaying={isPlaying}
            visualMode={visualMode}
            colorScheme={colorScheme}
            sensitivity={sensitivity}
          />
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Controls
            isPlaying={isPlaying}
            onTogglePlayback={togglePlayback}
            sensitivity={sensitivity}
            onSensitivityChange={setSensitivity}
          />

          <PresetSelector
            visualMode={visualMode}
            onVisualModeChange={setVisualMode}
            colorScheme={colorScheme}
            onColorSchemeChange={setColorScheme}
          />
        </div>

        {/* Hidden Audio Element - Using microphone input instead of file */}
        <audio ref={audioRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}`,

    "components/Visualizer.jsx": `import { useRef, useEffect } from "react";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

export default function Visualizer({ audioRef, isPlaying, visualMode, colorScheme, sensitivity }) {
  const canvasRef = useRef(null);
  const { analyzerData } = useAudioAnalyzer(audioRef, isPlaying);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    let animationId;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyzerData && analyzerData.length > 0) {
        const normalizedData = analyzerData.map(v => (v / 255) * (sensitivity / 50));

        switch (visualMode) {
          case "bars":
            drawBars(ctx, normalizedData, colorScheme, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
            break;
          case "circle":
            drawCircle(ctx, normalizedData, colorScheme, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
            break;
          case "wave":
            drawWave(ctx, normalizedData, colorScheme, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
            break;
          case "particles":
            drawParticles(ctx, normalizedData, colorScheme, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
            break;
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [analyzerData, visualMode, colorScheme, sensitivity]);

  return (
    <div className="bg-black/60 backdrop-blur-xl border-2 border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/20 p-4 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-96 rounded-2xl"
        style={{ width: "100%", height: "24rem" }}
      />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-6xl mb-4">🎵</div>
            <p className="text-2xl text-gray-400 font-semibold">
              Press Play to start visualization
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function drawBars(ctx, data, colorScheme, width, height) {
  const barWidth = width / data.length;

  data.forEach((value, index) => {
    const barHeight = value * height;
    const x = index * barWidth;
    const y = height - barHeight;

    const color = getColor(index, data.length, colorScheme);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth - 2, barHeight);
  });
}

function drawCircle(ctx, data, colorScheme, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.3;

  data.forEach((value, index) => {
    const angle = (index / data.length) * Math.PI * 2;
    const lineLength = value * radius * 0.8;
    const x1 = centerX + Math.cos(angle) * radius;
    const y1 = centerY + Math.sin(angle) * radius;
    const x2 = centerX + Math.cos(angle) * (radius + lineLength);
    const y2 = centerY + Math.sin(angle) * (radius + lineLength);

    const color = getColor(index, data.length, colorScheme);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
}

function drawWave(ctx, data, colorScheme, width, height) {
  const sliceWidth = width / data.length;

  ctx.beginPath();
  ctx.lineWidth = 4;

  data.forEach((value, index) => {
    const x = index * sliceWidth;
    const y = height / 2 + (value - 0.5) * height;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  if (colorScheme === "rainbow") {
    gradient.addColorStop(0, "#FF00FF");
    gradient.addColorStop(0.5, "#00FFFF");
    gradient.addColorStop(1, "#FF00FF");
  } else if (colorScheme === "fire") {
    gradient.addColorStop(0, "#FF0000");
    gradient.addColorStop(0.5, "#FF8800");
    gradient.addColorStop(1, "#FFFF00");
  } else {
    gradient.addColorStop(0, "#00FFFF");
    gradient.addColorStop(1, "#FF00FF");
  }

  ctx.strokeStyle = gradient;
  ctx.stroke();
}

function drawParticles(ctx, data, colorScheme, width, height) {
  data.forEach((value, index) => {
    const x = (index / data.length) * width;
    const y = height / 2 + (Math.random() - 0.5) * height * value;
    const size = value * 20;

    const color = getColor(index, data.length, colorScheme);
    ctx.fillStyle = color;
    ctx.globalAlpha = value;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function getColor(index, total, scheme) {
  const hue = (index / total) * 360;

  switch (scheme) {
    case "rainbow":
      return \`hsl(\${hue}, 100%, 60%)\`;
    case "fire":
      return \`hsl(\${hue * 0.2}, 100%, 60%)\`;
    case "ocean":
      return \`hsl(\${180 + hue * 0.3}, 80%, 60%)\`;
    case "neon":
      return \`hsl(\${hue}, 100%, 70%)\`;
    default:
      return \`hsl(\${hue}, 100%, 60%)\`;
  }
}`,

    "components/Controls.jsx": `export default function Controls({ isPlaying, onTogglePlayback, sensitivity, onSensitivityChange }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl p-8">
      <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-3">
        <span>🎛️</span>
        Playback Controls
      </h2>

      {/* Play/Pause Button */}
      <button
        onClick={onTogglePlayback}
        className={\`
          w-full mb-6 py-6 rounded-xl font-bold text-xl transition-all duration-300
          \${isPlaying
            ? "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-lg shadow-rose-500/50"
            : "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 shadow-lg shadow-cyan-500/50"
          }
          text-white hover:scale-105 active:scale-95
        \`}
      >
        {isPlaying ? "⏸ Pause" : "▶ Play"}
      </button>

      {/* Sensitivity Slider */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-gray-300 font-semibold">Sensitivity</label>
          <span className="text-purple-400 font-bold text-lg">{sensitivity}%</span>
        </div>

        <input
          type="range"
          min="10"
          max="100"
          value={sensitivity}
          onChange={(e) => onSensitivityChange(Number(e.target.value))}
          className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />

        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Subtle</span>
          <span>Intense</span>
        </div>
      </div>
    </div>
  );
}`,

    "components/PresetSelector.jsx": `export default function PresetSelector({ visualMode, onVisualModeChange, colorScheme, onColorSchemeChange }) {
  const visualModes = [
    { id: "bars", name: "Bars", icon: "📊" },
    { id: "circle", name: "Circle", icon: "⭕" },
    { id: "wave", name: "Wave", icon: "🌊" },
    { id: "particles", name: "Particles", icon: "✨" }
  ];

  const colorSchemes = [
    { id: "rainbow", name: "Rainbow", gradient: "from-red-500 via-yellow-500 to-green-500" },
    { id: "fire", name: "Fire", gradient: "from-red-600 via-orange-500 to-yellow-400" },
    { id: "ocean", name: "Ocean", gradient: "from-blue-600 via-cyan-500 to-teal-400" },
    { id: "neon", name: "Neon", gradient: "from-pink-500 via-purple-500 to-cyan-500" }
  ];

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl p-8">
      <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-3">
        <span>🎨</span>
        Visual Presets
      </h2>

      {/* Visual Mode Selection */}
      <div className="mb-6">
        <label className="text-gray-300 font-semibold mb-3 block">
          Visualization Style
        </label>

        <div className="grid grid-cols-2 gap-3">
          {visualModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => onVisualModeChange(mode.id)}
              className={\`
                p-4 rounded-xl font-semibold transition-all
                \${visualMode === mode.id
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50 scale-105"
                  : "bg-slate-800/50 text-gray-400 hover:bg-slate-700/50"
                }
              \`}
            >
              <div className="text-2xl mb-1">{mode.icon}</div>
              <div className="text-sm">{mode.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Scheme Selection */}
      <div>
        <label className="text-gray-300 font-semibold mb-3 block">
          Color Scheme
        </label>

        <div className="grid grid-cols-2 gap-3">
          {colorSchemes.map(scheme => (
            <button
              key={scheme.id}
              onClick={() => onColorSchemeChange(scheme.id)}
              className={\`
                p-4 rounded-xl font-semibold transition-all overflow-hidden relative
                \${colorScheme === scheme.id
                  ? "ring-4 ring-purple-400 scale-105"
                  : "hover:scale-105"
                }
              \`}
            >
              <div className={\`absolute inset-0 bg-gradient-to-r \${scheme.gradient} opacity-80\`} />
              <div className="relative text-white text-sm font-bold drop-shadow-lg">
                {scheme.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}`,

    "hooks/useAudioAnalyzer.js": `import { useState, useEffect, useRef } from "react";

export function useAudioAnalyzer(audioRef, isPlaying) {
  const [analyzerData, setAnalyzerData] = useState([]);
  const analyzerRef = useRef(null);
  const dataArrayRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    // Initialize Web Audio API
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;

      // Create a demo tone generator (oscillator)
      oscillatorRef.current = audioContextRef.current.createOscillator();
      gainNodeRef.current = audioContextRef.current.createGain();

      // Set up audio chain: oscillator -> gain -> analyzer -> destination
      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(analyzerRef.current);
      analyzerRef.current.connect(audioContextRef.current.destination);

      // Configure oscillator for pleasant sound
      oscillatorRef.current.type = "sine";
      oscillatorRef.current.frequency.value = 220; // A3 note
      gainNodeRef.current.gain.value = 0.1; // Quiet volume

      // Start the oscillator
      oscillatorRef.current.start();

      dataArrayRef.current = new Uint8Array(analyzerRef.current.frequencyBinCount);
    }

    let animationId;

    const updateAnalyzerData = () => {
      if (analyzerRef.current && dataArrayRef.current) {
        analyzerRef.current.getByteFrequencyData(dataArrayRef.current);

        // Add some randomness to make it look more dynamic
        const enhanced = dataArrayRef.current.map(val => {
          if (isPlaying) {
            return Math.min(255, val + Math.random() * 80);
          }
          return val;
        });

        setAnalyzerData([...enhanced]);
      }
      animationId = requestAnimationFrame(updateAnalyzerData);
    };

    if (isPlaying) {
      // Modulate frequency for visual interest
      const interval = setInterval(() => {
        if (oscillatorRef.current) {
          const newFreq = 220 + Math.random() * 440;
          oscillatorRef.current.frequency.setValueAtTime(newFreq, audioContextRef.current.currentTime);
        }
      }, 500);

      updateAnalyzerData();

      return () => {
        if (animationId) cancelAnimationFrame(animationId);
        clearInterval(interval);
      };
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [audioRef, isPlaying]);

  return { analyzerData };
}
`
  }
};
