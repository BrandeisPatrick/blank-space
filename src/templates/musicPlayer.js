// Music Player with Waveform - Complex UI with real-time audio visualization
export const musicPlayer = {
  name: "Music Player",
  files: {
    "App.jsx": `import { useState } from "react";
import Player from "./components/Player";
import Playlist from "./components/Playlist";
import Waveform from "./components/Waveform";

const DEMO_PLAYLIST = [
  { id: 1, title: "Neon Dreams", artist: "Synthwave Artist", duration: "3:45", frequency: 220, cover: "🌆" },
  { id: 2, title: "Cosmic Journey", artist: "Space Sounds", duration: "4:20", frequency: 294, cover: "🌌" },
  { id: 3, title: "Electric Pulse", artist: "Digital Beats", duration: "3:15", frequency: 330, cover: "⚡" },
  { id: 4, title: "Retro Wave", artist: "80s Vibes", duration: "4:05", frequency: 392, cover: "🎹" },
  { id: 5, title: "Future Bass", artist: "Modern Producer", duration: "3:30", frequency: 440, cover: "🎧" }
];

export default function App() {
  const [playlist] = useState(DEMO_PLAYLIST);
  const [currentTrack, setCurrentTrack] = useState(DEMO_PLAYLIST[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);

  const handleTrackSelect = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const handleNext = () => {
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const nextTrack = playlist[(currentIndex + 1) % playlist.length];
    handleTrackSelect(nextTrack);
  };

  const handlePrevious = () => {
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const prevTrack = playlist[(currentIndex - 1 + playlist.length) % playlist.length];
    handleTrackSelect(prevTrack);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            ♪ Music Player ♪
          </h1>
          <p className="text-xl text-gray-400">
            Your personal soundtrack to life
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Player & Waveform */}
          <div className="lg:col-span-2 space-y-6">
            <Player
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSeek={setCurrentTime}
              onVolumeChange={setVolume}
              onTimeUpdate={setCurrentTime}
              onDurationChange={setDuration}
            />

            <Waveform
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
            />
          </div>

          {/* Right Column - Playlist */}
          <div>
            <Playlist
              tracks={playlist}
              currentTrack={currentTrack}
              onTrackSelect={handleTrackSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}`,

    "components/Player.jsx": `import { useRef, useEffect } from "react";

export default function Player({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onTimeUpdate,
  onDurationChange
}) {
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(0);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);

      // Set initial duration (from track duration string like "3:45")
      const [min, sec] = currentTrack.duration.split(':').map(Number);
      const totalSeconds = min * 60 + sec;
      onDurationChange(totalSeconds);
    }

    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle play/pause
  useEffect(() => {
    if (!audioContextRef.current) return;

    if (isPlaying) {
      // Create new oscillator
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
      }

      oscillatorRef.current = audioContextRef.current.createOscillator();
      oscillatorRef.current.connect(gainNodeRef.current);
      oscillatorRef.current.type = 'sine';
      oscillatorRef.current.frequency.value = currentTrack.frequency || 440;
      oscillatorRef.current.start();

      // Start time tracking
      startTimeRef.current = Date.now() - (currentTime * 1000);
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const [min, sec] = currentTrack.duration.split(':').map(Number);
        const totalSeconds = min * 60 + sec;

        if (elapsed >= totalSeconds) {
          onNext();
          clearInterval(intervalRef.current);
        } else {
          onTimeUpdate(elapsed);
        }
      }, 100);
    } else {
      // Stop oscillator
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
        oscillatorRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = (volume / 100) * 0.1; // Keep it quiet
    }
  }, [volume]);

  // Handle track changes
  useEffect(() => {
    if (currentTrack && audioContextRef.current) {
      // Stop current oscillator
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
      }

      // Update duration
      const [min, sec] = currentTrack.duration.split(':').map(Number);
      const totalSeconds = min * 60 + sec;
      onDurationChange(totalSeconds);

      // Create new oscillator with track frequency if playing
      if (isPlaying) {
        oscillatorRef.current = audioContextRef.current.createOscillator();
        oscillatorRef.current.connect(gainNodeRef.current);
        oscillatorRef.current.type = 'sine';
        oscillatorRef.current.frequency.value = currentTrack.frequency || 440;
        oscillatorRef.current.start();

        startTimeRef.current = Date.now();
      }
    }
  }, [currentTrack]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return \`\${minutes}:\${seconds.toString().padStart(2, "0")}\`;
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/20 p-8">
      {/* Album Art & Info */}
      <div className="flex items-center gap-6 mb-8">
        <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-6xl shadow-xl shadow-purple-500/30">
          {currentTrack.cover}
        </div>

        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-100 mb-2">
            {currentTrack.title}
          </h2>
          <p className="text-xl text-purple-400">
            {currentTrack.artist}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={(e) => {
            const time = Number(e.target.value);
            onSeek(time);
            if (audioRef.current) {
              audioRef.current.currentTime = time;
            }
          }}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />

        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={onPrevious}
          className="w-14 h-14 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-2xl text-gray-300 hover:text-white transition-all hover:scale-110 active:scale-95"
        >
          ⏮
        </button>

        <button
          onClick={onPlayPause}
          className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full flex items-center justify-center text-4xl text-white shadow-xl shadow-purple-500/50 transition-all hover:scale-110 active:scale-95"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <button
          onClick={onNext}
          className="w-14 h-14 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-2xl text-gray-300 hover:text-white transition-all hover:scale-110 active:scale-95"
        >
          ⏭
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-4">
        <span className="text-2xl text-gray-400">🔊</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <span className="text-gray-400 font-semibold w-12 text-right">
          {volume}%
        </span>
      </div>
    </div>
  );
}`,

    "components/Waveform.jsx": `import { useRef, useEffect } from "react";

export default function Waveform({ isPlaying, currentTime, duration }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    const bars = 100;
    const barWidth = w / bars;
    const progress = duration > 0 ? currentTime / duration : 0;

    for (let i = 0; i < bars; i++) {
      const barHeight = Math.random() * h * 0.6 + h * 0.2;
      const x = i * barWidth;
      const y = (h - barHeight) / 2;

      // Create gradient for played vs unplayed portions
      const isPassed = i / bars < progress;
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);

      if (isPassed) {
        gradient.addColorStop(0, "#A855F7");
        gradient.addColorStop(1, "#EC4899");
      } else {
        gradient.addColorStop(0, "#475569");
        gradient.addColorStop(1, "#334155");
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 2, barHeight);

      // Add glow effect to current position
      if (isPlaying && Math.abs(i / bars - progress) < 0.02) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#A855F7";
        ctx.fillStyle = "#A855F7";
        ctx.fillRect(x, y, barWidth - 2, barHeight);
        ctx.shadowBlur = 0;
      }
    }

    // Draw progress line
    if (duration > 0) {
      const lineX = progress * w;
      ctx.strokeStyle = "#F472B6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lineX, 0);
      ctx.lineTo(lineX, h);
      ctx.stroke();
    }
  }, [isPlaying, currentTime, duration]);

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <span>📊</span>
          Waveform
        </h3>
        {isPlaying && (
          <div className="flex items-center gap-2 text-sm text-purple-400 animate-pulse">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping" />
            Now Playing
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-32 rounded-xl bg-slate-950/50"
        style={{ width: "100%", height: "8rem" }}
      />
    </div>
  );
}`,

    "components/Playlist.jsx": `export default function Playlist({ tracks, currentTrack, onTrackSelect }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl p-6">
      <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-3">
        <span>🎵</span>
        Playlist
      </h2>

      <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
        {tracks.map(track => {
          const isActive = currentTrack.id === track.id;

          return (
            <button
              key={track.id}
              onClick={() => onTrackSelect(track)}
              className={\`
                w-full text-left p-4 rounded-xl transition-all
                \${isActive
                  ? "bg-gradient-to-r from-purple-600/40 to-pink-600/40 border-2 border-purple-400 shadow-lg shadow-purple-500/30"
                  : "bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50"
                }
              \`}
            >
              <div className="flex items-center gap-4">
                <div className={\`
                  w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                  \${isActive ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-slate-700"}
                \`}>
                  {track.cover}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={\`font-semibold truncate \${isActive ? "text-purple-300" : "text-gray-200"}\`}>
                    {track.title}
                  </div>
                  <div className="text-sm text-gray-400 truncate">
                    {track.artist}
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  {track.duration}
                </div>
              </div>

              {isActive && (
                <div className="mt-2 flex items-center gap-2 text-xs text-purple-400">
                  <div className="flex gap-1">
                    <div className="w-1 h-3 bg-purple-400 animate-pulse" style={{ animationDelay: "0ms" }} />
                    <div className="w-1 h-3 bg-purple-400 animate-pulse" style={{ animationDelay: "150ms" }} />
                    <div className="w-1 h-3 bg-purple-400 animate-pulse" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span>Playing now</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
`
  }
};
