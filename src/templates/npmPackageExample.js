// NPM package integration example using date-fns
export const npmPackageFiles = {
  "/App.js": {
    code: `import { useState } from 'react';
import DateFormatter from './components/DateFormatter';
import TimeAgo from './components/TimeAgo';
import DateCalculator from './components/DateCalculator';
import './styles.css';

export default function App() {
  return (
    <div className="app">
      <h1>📦 NPM Package Demo</h1>
      <p className="subtitle">Using date-fns library</p>

      <div className="grid">
        <DateFormatter />
        <TimeAgo />
        <DateCalculator />
      </div>
    </div>
  );
}`,
  },
  "/components/DateFormatter.js": {
    code: `import { format } from 'date-fns';
import { useState } from 'react';

const formatOptions = [
  { label: 'Full Date', value: 'PPPP' },
  { label: 'Short Date', value: 'PP' },
  { label: 'Time', value: 'p' },
  { label: 'DateTime', value: 'PPpp' },
  { label: 'Custom', value: "yyyy-MM-dd 'at' HH:mm" },
];

export default function DateFormatter() {
  const [selectedFormat, setSelectedFormat] = useState('PPPP');
  const now = new Date();

  return (
    <div className="card">
      <h2>📅 Date Formatter</h2>

      <div className="format-selector">
        {formatOptions.map(option => (
          <button
            key={option.value}
            className={selectedFormat === option.value ? 'active' : ''}
            onClick={() => setSelectedFormat(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="result">
        <div className="result-label">Formatted Date:</div>
        <div className="result-value">
          {format(now, selectedFormat)}
        </div>
      </div>

      <div className="code-display">
        <code>format(new Date(), '{selectedFormat}')</code>
      </div>
    </div>
  );
}`,
  },
  "/components/TimeAgo.js": {
    code: `import { formatDistanceToNow, subDays, subHours, subMinutes } from 'date-fns';
import { useState, useEffect } from 'react';

const timePoints = [
  { label: '2 minutes ago', date: () => subMinutes(new Date(), 2) },
  { label: '3 hours ago', date: () => subHours(new Date(), 3) },
  { label: '5 days ago', date: () => subDays(new Date(), 5) },
  { label: '30 days ago', date: () => subDays(new Date(), 30) },
];

export default function TimeAgo() {
  const [selectedTime, setSelectedTime] = useState(0);
  const [tick, setTick] = useState(0);

  // Update every second to show live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedDate = timePoints[selectedTime].date();

  return (
    <div className="card">
      <h2>⏰ Time Ago</h2>

      <div className="time-selector">
        {timePoints.map((point, index) => (
          <button
            key={index}
            className={selectedTime === index ? 'active' : ''}
            onClick={() => setSelectedTime(index)}
          >
            {point.label}
          </button>
        ))}
      </div>

      <div className="result">
        <div className="result-label">Relative Time:</div>
        <div className="result-value">
          {formatDistanceToNow(selectedDate, { addSuffix: true })}
        </div>
      </div>

      <div className="live-indicator">
        🔴 Live updating every second
      </div>
    </div>
  );
}`,
  },
  "/components/DateCalculator.js": {
    code: `import { addDays, addMonths, differenceInDays, differenceInWeeks } from 'date-fns';
import { useState } from 'react';

export default function DateCalculator() {
  const [daysToAdd, setDaysToAdd] = useState(7);
  const [startDate] = useState(new Date());
  const futureDate = addDays(startDate, daysToAdd);

  const daysDiff = differenceInDays(futureDate, startDate);
  const weeksDiff = differenceInWeeks(futureDate, startDate);

  return (
    <div className="card">
      <h2>🧮 Date Calculator</h2>

      <div className="calculator">
        <label>
          Add days to today:
          <input
            type="range"
            min="1"
            max="365"
            value={daysToAdd}
            onChange={(e) => setDaysToAdd(Number(e.target.value))}
          />
          <span className="value">{daysToAdd} days</span>
        </label>

        <div className="calc-results">
          <div className="calc-row">
            <span>Start Date:</span>
            <strong>{startDate.toLocaleDateString()}</strong>
          </div>
          <div className="calc-row">
            <span>Future Date:</span>
            <strong>{futureDate.toLocaleDateString()}</strong>
          </div>
          <div className="calc-row highlight">
            <span>Difference:</span>
            <strong>{daysDiff} days ({weeksDiff} weeks)</strong>
          </div>
        </div>

        <div className="quick-actions">
          <button onClick={() => setDaysToAdd(7)}>1 Week</button>
          <button onClick={() => setDaysToAdd(30)}>1 Month</button>
          <button onClick={() => setDaysToAdd(90)}>3 Months</button>
          <button onClick={() => setDaysToAdd(365)}>1 Year</button>
        </div>
      </div>
    </div>
  );
}`,
  },
  "/styles.css": {
    code: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  min-height: 100vh;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
}

.app h1 {
  color: white;
  text-align: center;
  margin-bottom: 8px;
  font-size: 2.5rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin-bottom: 40px;
  font-size: 1.1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.card {
  background: white;
  padding: 28px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.card h2 {
  color: #1f2937;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

/* Date Formatter */
.format-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.format-selector button,
.time-selector button {
  padding: 8px 16px;
  background: #f3f4f6;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
}

.format-selector button:hover,
.time-selector button:hover {
  background: #e5e7eb;
}

.format-selector button.active,
.time-selector button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.result {
  background: #f9fafb;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.result-label {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
}

.result-value {
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 700;
}

.code-display {
  background: #1f2937;
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
}

.code-display code {
  color: #10b981;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

/* Time Ago */
.time-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.time-selector button {
  text-align: left;
}

.live-indicator {
  text-align: center;
  color: #6b7280;
  font-size: 13px;
  margin-top: 16px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Date Calculator */
.calculator {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.calculator label {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #374151;
  font-weight: 500;
}

.calculator input[type="range"] {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e5e7eb;
  outline: none;
  cursor: pointer;
}

.calculator input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
}

.value {
  color: #667eea;
  font-weight: 700;
  font-size: 1.1rem;
}

.calc-results {
  background: #f9fafb;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #374151;
}

.calc-row.highlight {
  padding-top: 12px;
  border-top: 2px solid #e5e7eb;
  color: #667eea;
  font-size: 1.1rem;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.quick-actions button {
  padding: 10px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.quick-actions button:hover {
  background: #5568d3;
  transform: translateY(-2px);
}`,
  },
  "/package.json": {
    code: `{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "date-fns": "^3.0.0"
  }
}`,
  },
};
