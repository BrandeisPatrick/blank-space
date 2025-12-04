/**
 * Retro Typer Artifact
 * A retro-futuristic digital receipt printer
 */

export const retroTyperArtifact = {
  id: 'retro-typer',
  name: 'Retro Typer',
  description: 'A retro-futuristic digital receipt printer. Type messages and print them as stylish thermal receipts.',
  icon: 'productivity',
  files: {
    'App.jsx': `// Retro Typer
// A retro-futuristic digital receipt printer

const Receipt = ({ data }) => {
  return (
    <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Paper Shadow/Depth */}
      <div className="absolute inset-0 bg-gray-300/50 transform translate-y-2 rounded-sm blur-sm"></div>

      {/* Main Paper Body */}
      <div className="relative bg-white pt-5 px-5 pb-8 shadow-sm rounded-t-sm w-full min-h-[140px] flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1">

        {/* Header Metadata */}
        <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold tracking-widest uppercase mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>
          <span>Message</span>
          <span>{data.time}</span>
        </div>

        {/* Content */}
        <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ fontFamily: "'Space Mono', monospace" }}>
          {data.text}
          <span className="inline-block w-0.5 h-4 bg-gray-800 animate-pulse ml-1 align-middle"></span>
        </div>

        {/* Footer Metadata */}
        <div className="mt-5 flex justify-between items-end border-t border-dashed border-gray-200 pt-2">
          <span className="text-[9px] text-gray-300" style={{ fontFamily: "'Space Mono', monospace" }}>RETRO-TYPER</span>
          <span className="text-[9px] text-gray-300" style={{ fontFamily: "'Space Mono', monospace" }}>ID: #{data.id}</span>
        </div>

        {/* Serrated Bottom Edge */}
        <div
          className="absolute left-0 right-0 h-4 bg-white w-full"
          style={{
            maskImage: 'radial-gradient(circle at 8px 0, transparent 0, transparent 4px, black 4px)',
            maskSize: '16px 16px',
            maskRepeat: 'repeat-x',
            WebkitMaskImage: 'radial-gradient(circle at 8px 0, transparent 0, transparent 4px, black 4px)',
            WebkitMaskSize: '16px 16px',
            WebkitMaskRepeat: 'repeat-x',
            bottom: '-4px'
          }}
        />
      </div>
    </div>
  );
};

const Device = ({ onPrint, onClear, input, setInput }) => {
  const textareaRef = useRef(null);

  const handlePrintClick = () => {
    if (!input.trim()) return;
    onPrint(input);
    setInput('');
    // Use setTimeout to ensure focus works on mobile
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleClearClick = () => {
    setInput('');
    onClear();
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // Handle touch on screen area to focus textarea
  const handleScreenTouch = (e) => {
    // Prevent default to avoid double-tap zoom on mobile
    if (e.target.tagName !== 'TEXTAREA') {
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Device Body */}
      <div className="bg-[#8cd842] rounded-[2.5rem] p-6 pb-12 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] border-b-[8px] border-[#7abf3a] relative z-10 transition-transform">

        {/* Top Antenna/Paper Feed Bump */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-[#1a1a1a] rounded-t-lg -z-10 shadow-lg"></div>

        {/* Status Bar Decor */}
        <div className="flex justify-between items-center mb-2 px-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-lime-900 tracking-wider opacity-60" style={{ fontFamily: "'Space Mono', monospace" }}>AUTO-FEED</span>
          </div>
          <div className="flex items-center gap-2 text-lime-900 opacity-60">
            <span className="text-[10px] font-bold" style={{ fontFamily: "'Space Mono', monospace" }}>5G</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
            </svg>
          </div>
        </div>

        {/* Series Label */}
        <div className="mb-4 px-2">
          <span className="text-[10px] font-bold text-lime-900 tracking-widest opacity-50" style={{ fontFamily: "'Space Mono', monospace" }}>RETRO TYPER</span>
        </div>

        {/* Screen Container */}
        <div
          className="bg-[#111] rounded-2xl p-4 shadow-[inset_0_2px_10px_rgba(0,0,0,1)] border-[3px] border-[#1a1a1a] relative mb-8"
          onClick={handleScreenTouch}
          onTouchStart={handleScreenTouch}
        >
          {/* Screen Header */}
          <div className="flex justify-between items-center mb-3 text-[#333] border-b border-[#222] pb-1">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#222] rounded-sm"></div>
              <span className="text-[10px] text-green-700 tracking-widest" style={{ fontFamily: "'VT323', monospace" }}>COMPOSE_MODE</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-800">
              <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
              <line x1="23" y1="13" x2="23" y2="11" />
            </svg>
          </div>

          {/* The Screen / Text Area */}
          <div className="relative">
            <span className="absolute left-0 top-1 text-green-500 text-xl" style={{ fontFamily: "'VT323', monospace" }}>{'>'}</span>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={(e) => setInput(e.target.value)}
              placeholder="TYPE MESSAGE..."
              className="w-full h-24 bg-transparent border-none outline-none text-green-500 text-xl pl-5 resize-none placeholder-green-900/50 leading-tight"
              style={{
                fontFamily: "'VT323', monospace",
                textShadow: '0 0 5px rgba(34,197,94,0.4)',
                WebkitAppearance: 'none',
                WebkitUserSelect: 'text',
                userSelect: 'text',
                touchAction: 'manipulation'
              }}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              inputMode="text"
            />
            {/* Blinking Cursor Block if empty */}
            {!input && (
              <span className="absolute left-5 top-1 w-2.5 h-5 bg-green-500 animate-pulse opacity-50 pointer-events-none"></span>
            )}
          </div>
        </div>

        {/* Controls Area */}
        <div className="flex items-center justify-between gap-4 px-1">

          <div className="flex gap-3">
            {/* Delete Button */}
            <button
              onClick={handleClearClick}
              className="w-14 h-14 rounded-full bg-[#2d3436] shadow-[0_4px_0_#1a1a1a] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center group"
              title="Clear"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-red-400 transition-colors">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>

          {/* Menu Deco Button (Non-functional) */}
          <div className="flex-grow flex justify-center">
            <div className="w-10 h-10 flex items-center justify-center opacity-20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lime-900">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrintClick}
            className="h-16 px-8 bg-[#ff6b2b] rounded-2xl shadow-[0_6px_0_#c44915] active:shadow-none active:translate-y-[6px] transition-all flex items-center gap-3 group"
          >
            <span className="text-orange-900 font-bold tracking-wider text-lg group-hover:text-white transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>PRINT</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-900 group-hover:text-white transition-colors">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
          </button>

        </div>

        {/* Branding Label */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#1a1a1a] text-gray-500 text-[8px] font-bold tracking-widest py-0.5 px-2 rounded-[2px] shadow-sm z-20">
          MOTOROLA
        </div>

      </div>
    </div>
  );
};

function App() {
  const [receipts, setReceipts] = useState([
    {
      id: '8658',
      text: 'Hello!',
      time: '08:06'
    },
    {
      id: '6995',
      text: 'Welcome to Retro Typer',
      time: '08:07'
    },
    {
      id: '7052',
      text: 'Type a message and press PRINT to create a receipt.',
      time: '08:08'
    }
  ]);
  const [input, setInput] = useState('');

  const handlePrint = (text) => {
    const now = new Date();
    const newReceipt = {
      id: Math.floor(Math.random() * 9000 + 1000).toString(),
      text: text,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setReceipts(prev => [newReceipt, ...prev]);
  };

  const handleClear = () => {
    console.log("Device input cleared");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: '#f0f2f5', backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=VT323&display=swap" rel="stylesheet" />

      {/* Main Content Area */}
      <div className="w-full max-w-5xl flex flex-col gap-12 items-center z-10">

        {/* Receipt Output Area */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min min-h-[200px] content-end items-end mb-8">
          {receipts.slice(0, 3).map((receipt) => (
            <Receipt key={receipt.id} data={receipt} />
          ))}
        </div>

        {/* The Device */}
        <Device
          onPrint={handlePrint}
          onClear={handleClear}
          input={input}
          setInput={setInput}
        />

        {/* Instructions/Footer */}
        <div className="text-gray-400 text-xs text-center opacity-60 mt-8" style={{ fontFamily: "'Space Mono', monospace" }}>
          PRESS <span className="text-orange-500 font-bold">PRINT</span> TO PUBLISH
        </div>
      </div>

      {/* Animation styles */}
      <style>{\`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: fadeIn 0.5s ease-out, slideInFromBottom 0.5s ease-out;
        }
      \`}</style>
    </div>
  );
}
`,
    'styles.css': `/* Retro Typer Styles */
body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', system-ui, sans-serif;
}

/* Custom scrollbar for the textarea */
textarea::-webkit-scrollbar {
  width: 8px;
}

textarea::-webkit-scrollbar-track {
  background: #1a1a1a;
}

textarea::-webkit-scrollbar-thumb {
  background: #4ade80;
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: #22c55e;
}
`
  }
};
