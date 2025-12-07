/**
 * Music Player UI
 * Beautiful audio player interface with visualizations - Modern design with SVG icons
 */

export const musicPlayerArtifact = {
  id: 'music-player',
  name: 'Music Player',
  description: 'A sleek music player with rotating album art, animated SVG progress ring, real-time equalizer visualization, and playlist management. Showcases SVG animations, gradient-based album covers, and smooth Framer Motion transitions.',
  icon: 'music',
  category: 'demos',
  files: {
    'App.jsx': `
// SVG Icon Components
const PlayIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
  </svg>
);

const SkipBackIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="19 20 9 12 19 4 19 20"/>
    <line x1="5" y1="19" x2="5" y2="5"/>
  </svg>
);

const SkipForwardIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4"/>
    <line x1="19" y1="5" x2="19" y2="19"/>
  </svg>
);

const VolumeIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
);

// Album art gradients instead of emojis
const albumGradients = [
  { from: 'from-indigo-500', to: 'to-purple-600', letter: 'M' },
  { from: 'from-amber-500', to: 'to-orange-600', letter: 'E' },
  { from: 'from-cyan-500', to: 'to-blue-600', letter: 'O' },
  { from: 'from-pink-500', to: 'to-rose-600', letter: 'C' },
  { from: 'from-emerald-500', to: 'to-teal-600', letter: 'F' },
];

const playlist = [
  { id: 1, title: 'Midnight Dreams', artist: 'Luna Wave', duration: '3:42', gradient: 0 },
  { id: 2, title: 'Electric Soul', artist: 'Neon Pulse', duration: '4:15', gradient: 1 },
  { id: 3, title: 'Ocean Breeze', artist: 'Coastal', duration: '3:58', gradient: 2 },
  { id: 4, title: 'City Lights', artist: 'Urban Echo', duration: '4:32', gradient: 3 },
  { id: 5, title: 'Forest Walk', artist: 'Nature Sounds', duration: '5:10', gradient: 4 },
];

// Animated Equalizer Bars
function Equalizer({ isPlaying }) {
  return (
    <div className="flex items-end gap-0.5 sm:gap-1 h-6 sm:h-8">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-0.5 sm:w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full"
          animate={isPlaying ? {
            height: [8, 24, 12, 32, 16, 8],
          } : { height: 8 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Album Art Component
function AlbumArt({ gradient, size = 'large' }) {
  const g = albumGradients[gradient] || albumGradients[0];
  const sizeClass = size === 'large'
    ? 'w-28 h-28 sm:w-32 sm:h-32 text-4xl sm:text-5xl'
    : 'w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl';

  return (
    <div className={\`\${sizeClass} rounded-full bg-gradient-to-br \${g.from} \${g.to} flex items-center justify-center text-white font-bold shadow-2xl\`}>
      {g.letter}
    </div>
  );
}

// Circular Progress Ring
function ProgressRing({ progress, size = 200 }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#gradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        style={{ strokeDasharray: circumference }}
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function App() {
  const [currentTrack, setCurrentTrack] = useState(playlist[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const [volume, setVolume] = useState(75);

  // Simulate progress
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Responsive ring size
  const ringSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 160 : 200;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 sm:p-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm sm:max-w-md"
      >
        {/* Main Player Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 mb-4 sm:mb-6 shadow-xl shadow-black/20">
          {/* Album Art with Progress Ring */}
          <div className="relative flex justify-center mb-6 sm:mb-8">
            <ProgressRing progress={progress} size={ringSize} />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <AlbumArt gradient={currentTrack.gradient} size="large" />
            </motion.div>
          </div>

          {/* Track Info */}
          <div className="text-center mb-4 sm:mb-6">
            <motion.h2
              key={currentTrack.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-2xl font-bold text-white mb-1"
            >
              {currentTrack.title}
            </motion.h2>
            <p className="text-slate-400 text-sm sm:text-base">{currentTrack.artist}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ width: \`\${progress}%\` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>{Math.floor(progress * 0.042)}:{String(Math.floor((progress * 2.5) % 60)).padStart(2, '0')}</span>
              <span>{currentTrack.duration}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const idx = playlist.findIndex(t => t.id === currentTrack.id);
                setCurrentTrack(playlist[(idx - 1 + playlist.length) % playlist.length]);
                setProgress(0);
              }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-700/50 backdrop-blur flex items-center justify-center text-white hover:bg-slate-600/50 transition-colors"
            >
              <SkipBackIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30"
            >
              {isPlaying ? <PauseIcon className="w-6 h-6 sm:w-7 sm:h-7" /> : <PlayIcon className="w-6 h-6 sm:w-7 sm:h-7 ml-1" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                const idx = playlist.findIndex(t => t.id === currentTrack.id);
                setCurrentTrack(playlist[(idx + 1) % playlist.length]);
                setProgress(0);
              }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-700/50 backdrop-blur flex items-center justify-center text-white hover:bg-slate-600/50 transition-colors"
            >
              <SkipForwardIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
          </div>

          {/* Volume & Equalizer */}
          <div className="flex items-center justify-between mt-4 sm:mt-6">
            <div className="flex items-center gap-2">
              <VolumeIcon className="w-4 h-4 text-slate-400" />
              <div className="w-20 sm:w-24 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400" style={{ width: \`\${volume}%\` }} />
              </div>
            </div>
            <Equalizer isPlaying={isPlaying} />
          </div>
        </div>

        {/* Playlist */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg shadow-black/10">
          <div className="p-3 sm:p-4 border-b border-slate-700/50">
            <h3 className="text-white font-semibold text-sm sm:text-base">Up Next</h3>
          </div>
          <div className="max-h-40 sm:max-h-48 overflow-y-auto">
            {playlist.map((track) => (
              <motion.button
                key={track.id}
                onClick={() => {
                  setCurrentTrack(track);
                  setProgress(0);
                }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                className={\`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-left transition-colors \${
                  currentTrack.id === track.id ? 'bg-purple-500/10' : ''
                }\`}
              >
                <AlbumArt gradient={track.gradient} size="small" />
                <div className="flex-1 min-w-0">
                  <p className={\`text-xs sm:text-sm truncate \${currentTrack.id === track.id ? 'text-purple-400' : 'text-white'}\`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{track.artist}</p>
                </div>
                <span className="text-xs text-slate-500">{track.duration}</span>
                {currentTrack.id === track.id && isPlaying && (
                  <Equalizer isPlaying={true} />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default App;
`
  }
};
