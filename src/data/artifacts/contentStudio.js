/**
 * Content Studio
 * Create promotional images with phone mockups, customizable text and colors
 */

export const contentStudioArtifact = {
  id: 'content-studio',
  name: 'Content Studio',
  description: 'Create clean promotional images with phone mockups, customizable text and colors. Upload screenshots, edit marketing text, and export as PNG.',
  icon: 'app',
  category: 'apps',
  files: {
    'App.jsx': `
function App() {
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('Type your title');
  const [subtitle, setSubtitle] = useState('Type your subtitle');
  const [bgColor, setBgColor] = useState('#f5f5f0');
  const [textColor, setTextColor] = useState('#1a1a1a');
  const [titleSize, setTitleSize] = useState(37);
  const [subtitleSize, setSubtitleSize] = useState(27);
  const [canvasSize, setCanvasSize] = useState('instagram-portrait');
  const [panelOpen, setPanelOpen] = useState(true);
  const [imageZoom, setImageZoom] = useState(1);
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  // Load Nunito font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const canvasSizes = {
    'instagram-portrait': { width: 1080, height: 1350, label: 'Instagram Portrait (4:5)' },
    'instagram-square': { width: 1080, height: 1080, label: 'Instagram Square (1:1)' },
    'instagram-story': { width: 1080, height: 1920, label: 'Instagram Story (9:16)' },
    'x-post': { width: 1200, height: 675, label: 'X Post (16:9)' },
    'x-header': { width: 1500, height: 500, label: 'X Header (3:1)' },
    'facebook-post': { width: 1200, height: 630, label: 'Facebook Post' },
    'linkedin-post': { width: 1200, height: 627, label: 'LinkedIn Post' },
  };

  const currentCanvas = canvasSizes[canvasSize];

  // Background: 2024-2025 trending colors
  const bgColors = [
    '#ffffff', // Pure white
    '#f5f5f0', // Cream white
    '#a47764', // Mocha Mousse (Pantone 2025)
    '#d4c4b0', // Warm beige
    '#b7c4a6', // Sage green
    '#dbeafe', // Soft blue
    '#fce7f3', // Soft pink
    '#1e293b', // Slate dark
  ];
  // Text: professional & accent colors
  const textColors = [
    '#000000', // Black
    '#1f2937', // Charcoal
    '#ffffff', // White
    '#1e3a5f', // Navy blue
    '#9f1239', // Cherry red
    '#c2410c', // Burnt orange
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setImage(event.target.result);
    reader.readAsDataURL(file);
  };

  const exportAsPng = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Use selected canvas dimensions
    canvas.width = currentCanvas.width;
    canvas.height = currentCanvas.height;

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate scale factor based on canvas size
    const scaleFactor = Math.min(canvas.width / 1080, canvas.height / 1350);
    const scaledTitleSize = titleSize * scaleFactor;
    const scaledSubtitleSize = subtitleSize * scaleFactor;

    // Draw title at top
    ctx.fillStyle = textColor;
    ctx.font = \`800 \${scaledTitleSize}px Nunito, system-ui, sans-serif\`;
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 60 * scaleFactor + scaledTitleSize);

    // Draw subtitle below title
    ctx.font = \`600 \${scaledSubtitleSize}px Nunito, system-ui, sans-serif\`;
    ctx.fillText(subtitle, canvas.width / 2, 60 * scaleFactor + scaledTitleSize + scaledSubtitleSize + 10);

    // Phone frame dimensions - positioned at bottom, touching edge
    const phoneAspect = 380 / 780;
    let phoneWidth = 380 * scaleFactor;
    let phoneHeight = 780 * scaleFactor;

    // Make sure phone fits width
    if (phoneWidth > canvas.width * 0.5) {
      phoneWidth = canvas.width * 0.5;
      phoneHeight = phoneWidth / phoneAspect;
    }

    const phoneX = (canvas.width - phoneWidth) / 2;
    // Position phone so bottom part extends beyond canvas (touching bottom edge)
    const phoneY = canvas.height - phoneHeight * 0.75;
    const cornerRadius = 55 * (phoneWidth / 380);

    // Draw phone frame
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.roundRect(phoneX, phoneY, phoneWidth, phoneHeight, cornerRadius);
    ctx.fill();

    // Draw Dynamic Island (scaled)
    const islandScale = phoneWidth / 380;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(phoneX + phoneWidth/2 - 60 * islandScale, phoneY + 15 * islandScale, 120 * islandScale, 35 * islandScale, 20 * islandScale);
    ctx.fill();

    // Draw screen area with image
    const screenPadding = 12 * islandScale;
    const screenX = phoneX + screenPadding;
    const screenY = phoneY + screenPadding;
    const screenWidth = phoneWidth - screenPadding * 2;
    const screenHeight = phoneHeight - screenPadding * 2;
    const screenRadius = cornerRadius - screenPadding;

    const saveImage = (dataUrl) => {
      // Try Web Share API for mobile
      if (navigator.share && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          const file = new File([blob], 'content-studio.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({ files: [file], title: 'Content Studio Image' });
              return;
            } catch (err) {
              if (err.name !== 'AbortError') console.log('Share failed, falling back to download');
            }
          }
          // Fallback to download
          const link = document.createElement('a');
          link.download = 'content-studio.png';
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, 'image/png');
      } else {
        // Desktop download
        const link = document.createElement('a');
        link.download = 'content-studio.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    if (image) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(screenX, screenY, screenWidth, screenHeight, screenRadius);
        ctx.clip();

        // Fill screen area with black (for letterboxing)
        ctx.fillStyle = '#000000';
        ctx.fillRect(screenX, screenY, screenWidth, screenHeight);

        // Contain fit with zoom
        const imgRatio = img.width / img.height;
        const screenRatio = screenWidth / screenHeight;
        let drawWidth, drawHeight, drawX, drawY;

        // Contain fit - show full image, may letterbox
        if (imgRatio > screenRatio) {
          // Image is wider - fit to width
          drawWidth = screenWidth;
          drawHeight = drawWidth / imgRatio;
        } else {
          // Image is taller - fit to height
          drawHeight = screenHeight;
          drawWidth = drawHeight * imgRatio;
        }
        // Center horizontally, align to top
        drawX = screenX + (screenWidth - drawWidth) / 2;
        drawY = screenY;

        // Apply zoom
        drawWidth *= imageZoom;
        drawHeight *= imageZoom;
        drawX = screenX + (screenWidth - drawWidth) / 2;
        drawY = screenY;

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();

        saveImage(canvas.toDataURL('image/png'));
      };
      img.src = image;
    } else {
      // No image - draw placeholder
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath();
      ctx.roundRect(screenX, screenY, screenWidth, screenHeight, screenRadius);
      ctx.fill();

      saveImage(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{
        fontFamily: 'Nunito, system-ui, -apple-system, sans-serif',
        backgroundColor: '#faf9f6',
        backgroundImage: 'radial-gradient(#d4d4d4 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      {/* Preview Area - Left Side */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Toggle Button - Visible when panel is closed */}
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute right-4 top-4 w-10 h-10 bg-white hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all z-10 shadow-md border border-gray-200"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>
        )}

        {/* Canvas Preview Container */}
        <div
          ref={previewRef}
          className="flex flex-col items-center justify-between rounded-2xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: bgColor,
            aspectRatio: \`\${currentCanvas.width} / \${currentCanvas.height}\`,
            maxHeight: '85vh',
            maxWidth: panelOpen ? '70%' : '85%',
            width: 'auto',
            height: 'auto',
            minWidth: '280px',
            transition: 'max-width 0.3s ease',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* Text Section - Top */}
          <div className="pt-8 px-8 text-center">
            {/* Title */}
            <h1
              className="font-semibold mb-1"
              style={{ color: textColor, fontSize: \`\${titleSize * 0.55}px\`, letterSpacing: '-0.02em' }}
            >
              {title}
            </h1>

            {/* Subtitle */}
            <p
              className="font-normal"
              style={{ color: textColor, opacity: 0.8, fontSize: \`\${subtitleSize * 0.55}px\` }}
            >
              {subtitle}
            </p>
          </div>

          {/* Phone Frame - Bottom aligned */}
          <div
            className="relative cursor-pointer transition-transform duration-200 hover:scale-[1.01] mt-4"
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '220px', height: '380px', overflow: 'hidden', flexShrink: 0 }}
          >
            <div
              className="absolute top-0 left-0 right-0 bg-[#1c1c1e]"
              style={{ height: '480px', borderRadius: '36px' }}
            >
              {/* Dynamic Island */}
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 bg-black"
                style={{ width: '80px', height: '24px', borderRadius: '12px' }}
              />

              {/* Screen */}
              <div
                className="absolute bg-[#000] overflow-hidden flex flex-col items-center justify-start"
                style={{ top: '8px', left: '8px', right: '8px', bottom: '8px', borderRadius: '28px' }}
              >
                {image ? (
                  <img src={image} alt="Screenshot" className="w-full object-contain object-top" style={{ transform: \`scale(\${imageZoom})\`, transformOrigin: 'top center' }} />
                ) : (
                  <div className="text-center text-[#48484a] p-4">
                    <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs">Add image</span>
                  </div>
                )}
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
        </div>
      </div>

      {/* Settings Panel - Right Side (Sliding) */}
      <div
        className={\`w-[320px] bg-white flex flex-col h-screen overflow-hidden fixed right-0 top-0 transition-transform duration-300 ease-in-out shadow-xl border-l border-gray-200 \${
          panelOpen ? 'translate-x-0' : 'translate-x-full'
        }\`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-gray-900 text-sm font-semibold">Settings</h2>
          <button
            onClick={() => setPanelOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-all"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-6">

            {/* Canvas Section */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">Canvas</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(canvasSizes).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setCanvasSize(key)}
                    className={\`px-3 py-2 rounded-lg text-xs font-medium transition-all \${
                      canvasSize === key
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }\`}
                  >
                    {label.split(' (')[0]}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">{currentCanvas.width} x {currentCanvas.height}</p>
            </div>

            {/* Text Section */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">Text</label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-100 border-0 rounded-lg px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-gray-100 border-0 rounded-lg px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  placeholder="Subtitle"
                />
              </div>
            </div>

            {/* Sliders Section */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">Title</span>
                  <span className="text-xs text-gray-900 font-medium">{titleSize}px</span>
                </div>
                <div className="relative">
                  <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-[2px]">
                    {[16,18,20,22,24,26,28,30,32,34,36,38,40,42].map((v) => (
                      <div key={v} className={\`w-1.5 h-1.5 rounded-full \${titleSize >= v ? 'bg-gray-900' : 'bg-gray-300'}\`} />
                    ))}
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="42"
                    step="2"
                    value={titleSize}
                    onChange={(e) => setTitleSize(Number(e.target.value))}
                    className="relative w-full h-2 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">Subtitle</span>
                  <span className="text-xs text-gray-900 font-medium">{subtitleSize}px</span>
                </div>
                <div className="relative">
                  <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-[2px]">
                    {[14,16,18,20,22,24,26,28,30].map((v) => (
                      <div key={v} className={\`w-1.5 h-1.5 rounded-full \${subtitleSize >= v ? 'bg-gray-900' : 'bg-gray-300'}\`} />
                    ))}
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="30"
                    step="2"
                    value={subtitleSize}
                    onChange={(e) => setSubtitleSize(Number(e.target.value))}
                    className="relative w-full h-2 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                  />
                </div>
              </div>
              {image && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">Image</span>
                    <span className="text-xs text-gray-900 font-medium">{Math.round(imageZoom * 100)}%</span>
                  </div>
                  <div className="relative">
                    <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-[2px]">
                      {[0.5,0.75,1,1.25,1.5,1.75,2].map((v) => (
                        <div key={v} className={\`w-1.5 h-1.5 rounded-full \${imageZoom >= v ? 'bg-gray-900' : 'bg-gray-300'}\`} />
                      ))}
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.25"
                      value={imageZoom}
                      onChange={(e) => setImageZoom(Number(e.target.value))}
                      className="relative w-full h-2 bg-transparent appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Colors Section */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">Colors</label>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-500 mb-2 block">Background</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {bgColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setBgColor(color)}
                        className={\`w-8 h-8 rounded-lg transition-all border border-gray-300 \${
                          bgColor === color ? 'ring-2 ring-gray-900 ring-offset-2 ring-offset-white' : 'hover:scale-110'
                        }\`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <label className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 via-green-500 to-blue-500 cursor-pointer hover:scale-110 transition-all overflow-hidden border border-gray-300">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 mb-2 block">Text</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {textColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setTextColor(color)}
                        className={\`w-8 h-8 rounded-lg transition-all border border-gray-300 \${
                          textColor === color ? 'ring-2 ring-gray-900 ring-offset-2 ring-offset-white' : 'hover:scale-110'
                        }\`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <label className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 via-green-500 to-blue-500 cursor-pointer hover:scale-110 transition-all overflow-hidden border border-gray-300">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={exportAsPng}
            className="w-full bg-blue-500 hover:bg-blue-600 rounded-lg px-4 py-3 text-white text-sm font-semibold transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
`
  }
};
