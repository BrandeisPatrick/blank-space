/**
 * Weather App
 * Beautiful weather display with animations - Modern design with SVG icons
 */

export const weatherAppArtifact = {
  id: 'weather-app',
  name: 'Weather App',
  description: 'A beautiful weather app featuring custom SVG weather icons, animated floating clouds, temperature unit conversion, and responsive glassmorphism cards. Demonstrates inline SVG components, Framer Motion animations, and mobile-first Tailwind design.',
  icon: 'sun',
  category: 'demos',
  files: {
    'App.jsx': `
// SVG Icon Components
const SunIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

const MoonIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const CloudSunIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.947 12.65a4 4 0 1 0-5.925-4.128"/>
    <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6z"/>
  </svg>
);

const CloudIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
  </svg>
);

const RainIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
    <path d="M16 14v6M8 14v6M12 16v6"/>
  </svg>
);

const DropletIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
  </svg>
);

const WindIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
  </svg>
);

// Weather icon mapping
const WeatherIcons = {
  sun: SunIcon,
  moon: MoonIcon,
  'cloud-sun': CloudSunIcon,
  cloud: CloudIcon,
  rain: RainIcon,
};

const weatherData = {
  current: {
    temp: 24,
    condition: 'Partly Cloudy',
    humidity: 65,
    wind: 12,
    uv: 6,
    feelsLike: 26,
  },
  hourly: [
    { time: 'Now', temp: 24, icon: 'cloud-sun' },
    { time: '1PM', temp: 26, icon: 'sun' },
    { time: '2PM', temp: 27, icon: 'sun' },
    { time: '3PM', temp: 26, icon: 'cloud-sun' },
    { time: '4PM', temp: 24, icon: 'cloud' },
    { time: '5PM', temp: 22, icon: 'cloud' },
    { time: '6PM', temp: 20, icon: 'moon' },
  ],
  weekly: [
    { day: 'Mon', high: 25, low: 18, icon: 'sun' },
    { day: 'Tue', high: 27, low: 19, icon: 'sun' },
    { day: 'Wed', high: 23, low: 17, icon: 'rain' },
    { day: 'Thu', high: 21, low: 15, icon: 'rain' },
    { day: 'Fri', high: 24, low: 16, icon: 'cloud-sun' },
    { day: 'Sat', high: 26, low: 18, icon: 'sun' },
    { day: 'Sun', high: 28, low: 20, icon: 'sun' },
  ],
};

// Animated Weather Icon
function WeatherIcon({ icon, size = 'large' }) {
  const Icon = WeatherIcons[icon] || CloudSunIcon;
  const sizeClass = size === 'large' ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-6 h-6 sm:w-8 sm:h-8';

  return (
    <motion.div
      animate={{
        y: [0, -8, 0],
        rotate: [0, 3, -3, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Icon className={sizeClass + ' text-white drop-shadow-lg'} />
    </motion.div>
  );
}

// Floating Clouds Background
function CloudsBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ x: -200, y: 50 + i * 100 }}
          animate={{ x: '100vw' }}
          transition={{
            duration: 30 + i * 10,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 5,
          }}
        >
          <CloudIcon className="w-32 h-32 text-white/5" />
        </motion.div>
      ))}
    </div>
  );
}

// Stat Card
function StatCard({ icon: Icon, label, value, unit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 sm:p-4 text-center shadow-lg shadow-black/5"
    >
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-white/80" />
      <p className="text-white/60 text-xs mb-1">{label}</p>
      <p className="text-white font-semibold text-sm sm:text-base">
        {value}<span className="text-white/60 text-xs sm:text-sm">{unit}</span>
      </p>
    </motion.div>
  );
}

function App() {
  const [unit, setUnit] = useState('C');
  const [selectedDay, setSelectedDay] = useState(null);

  const convertTemp = (temp) => {
    return unit === 'C' ? temp : Math.round(temp * 9/5 + 32);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4 sm:p-6 relative overflow-hidden">
      <CloudsBackground />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-sm sm:max-w-md lg:max-w-lg mx-auto relative z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-white text-xl sm:text-2xl font-bold">San Francisco</h1>
            <p className="text-white/70 text-xs sm:text-sm">California, USA</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
            className="bg-white/20 backdrop-blur-xl border border-white/30 px-3 py-1.5 rounded-full text-white text-sm font-medium shadow-lg"
          >
            {unit}
          </motion.button>
        </div>

        {/* Current Weather */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 mb-4 sm:mb-6 text-center shadow-xl shadow-black/10"
        >
          <WeatherIcon icon="cloud-sun" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-5xl sm:text-6xl md:text-7xl font-light text-white mb-2">
              {convertTemp(weatherData.current.temp)}
            </p>
            <p className="text-white/80 text-lg sm:text-xl mb-3 sm:mb-4">{weatherData.current.condition}</p>
            <p className="text-white/60 text-xs sm:text-sm">
              Feels like {convertTemp(weatherData.current.feelsLike)}
            </p>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <StatCard icon={DropletIcon} label="Humidity" value={weatherData.current.humidity} unit="%" />
          <StatCard icon={WindIcon} label="Wind" value={weatherData.current.wind} unit="km/h" />
          <StatCard icon={SunIcon} label="UV Index" value={weatherData.current.uv} unit="" />
        </div>

        {/* Hourly Forecast */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-lg shadow-black/5">
          <h3 className="text-white font-semibold mb-3 text-sm sm:text-base">Hourly Forecast</h3>
          <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {weatherData.hourly.map((hour, i) => {
              const Icon = WeatherIcons[hour.icon] || CloudSunIcon;
              return (
                <motion.div
                  key={hour.time}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={\`flex-shrink-0 text-center p-2 sm:p-3 rounded-xl transition-colors \${i === 0 ? 'bg-white/20' : 'hover:bg-white/10'}\`}
                >
                  <p className="text-white/60 text-xs mb-2">{hour.time}</p>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-2 text-white" />
                  <p className="text-white font-semibold text-sm">{convertTemp(hour.temp)}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Weekly Forecast */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 sm:p-4 shadow-lg shadow-black/5">
          <h3 className="text-white font-semibold mb-3 text-sm sm:text-base">7-Day Forecast</h3>
          <div className="space-y-1 sm:space-y-2">
            {weatherData.weekly.map((day, i) => {
              const Icon = WeatherIcons[day.icon] || CloudSunIcon;
              return (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  onClick={() => setSelectedDay(selectedDay === i ? null : i)}
                  className="flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors"
                >
                  <span className="text-white w-10 sm:w-12 text-sm">{day.day}</span>
                  <Icon className="w-6 h-6 text-white" />
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-white font-semibold text-sm">{convertTemp(day.high)}</span>
                    <div className="w-12 sm:w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-400 to-orange-400"
                        initial={{ width: 0 }}
                        animate={{ width: \`\${((day.high - 15) / 15) * 100}%\` }}
                        transition={{ delay: i * 0.1 }}
                      />
                    </div>
                    <span className="text-white/60 text-sm">{convertTemp(day.low)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-4 sm:mt-6">
          Pure React + Tailwind + Framer Motion
        </p>
      </motion.div>
    </div>
  );
}

export default App;
`
  }
};
