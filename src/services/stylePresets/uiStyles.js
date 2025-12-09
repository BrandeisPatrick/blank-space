// AI Generation UI Styles
// Defines comprehensive UI style presets with full design system for AI

export const UI_STYLES = {
  glassmorphism: {
    id: "glassmorphism",
    name: "Glassmorphism",
    description: "Frosted glass effect with blur and transparency",

    // Typography
    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      h1: { size: "text-5xl md:text-6xl", weight: "font-bold", lineHeight: "leading-tight" },
      h2: { size: "text-3xl md:text-4xl", weight: "font-bold", lineHeight: "leading-snug" },
      h3: { size: "text-xl md:text-2xl", weight: "font-semibold", lineHeight: "leading-normal" },
      body: { size: "text-base", weight: "font-normal", lineHeight: "leading-relaxed" },
      small: { size: "text-sm", weight: "font-medium", lineHeight: "leading-normal" },
    },

    // Border Radius
    radius: {
      small: "rounded-lg",
      medium: "rounded-xl",
      large: "rounded-2xl",
      full: "rounded-full",
    },

    // Shadows
    shadows: {
      small: "shadow-md",
      medium: "shadow-xl",
      large: "shadow-2xl",
      glow: "shadow-xl shadow-{primary}/20",
    },

    // Component Patterns
    components: {
      pageWrapper: "min-h-screen bg-gradient-to-br {background.page} px-4 py-12",
      container: "max-w-4xl mx-auto",
      card: "bg-{background.card}/80 backdrop-blur-xl border border-{border}/20 rounded-2xl shadow-2xl p-8",
      cardHover: "hover:shadow-2xl hover:scale-[1.01] transition-all duration-300",
      button: {
        primary: "bg-{primary.base} hover:bg-{primary.hover} text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-{primary.base}/30 transition-all",
        secondary: "bg-{background.card}/50 hover:bg-{background.card}/70 text-{text.body} font-medium px-6 py-3 rounded-xl border border-{border}/50 transition-all",
        ghost: "text-{primary.base} hover:bg-{primary.light}/10 font-medium px-6 py-3 rounded-xl transition-all",
      },
      input: "bg-{background.card}/50 backdrop-blur border border-{border}/50 text-{text.body} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-{primary.base} transition-all placeholder:text-{text.muted}",
      listItem: "flex items-center gap-4 p-4 bg-{background.muted}/50 backdrop-blur border border-{border}/30 rounded-xl hover:bg-{background.muted}/70 transition-all",
      hero: {
        section: "relative overflow-hidden py-8 md:py-12",
        background: "absolute inset-0 bg-gradient-to-br {background.page}",
        glow: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] md:w-[200px] md:h-[200px] bg-{primary.base}/20 rounded-full blur-3xl",
        glowSecondary: "absolute top-1/4 right-1/4 w-[100px] h-[100px] md:w-[150px] md:h-[150px] bg-{secondary.base}/20 rounded-full blur-3xl",
        content: "relative z-10 text-center max-w-xl md:max-w-2xl mx-auto px-4",
        badge: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-{primary.base}/10 backdrop-blur-sm border border-{primary.base}/20 text-{primary.base} text-xs font-medium mb-4",
        title: "text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-{primary.base} via-{accent.base} to-{secondary.base} bg-clip-text text-transparent leading-tight",
        buttons: "flex flex-col sm:flex-row gap-3 justify-center mt-6",
      },
    },

    // Prompt snippet for AI
    promptSnippet: `UI STYLE: GLASSMORPHISM
- Use semi-transparent backgrounds with backdrop-blur-xl
- Containers: "bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
- Cards: "bg-white/60 backdrop-blur-lg border border-white/30 rounded-xl p-6"
- Layered depth through transparency and blur
- Subtle shadows with color glow effects
- Large rounded corners (rounded-xl, rounded-2xl)
- Smooth transitions on all interactive elements`,

    preview: {
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4))",
      border: "1px solid rgba(255,255,255,0.3)",
      blur: true,
    },
  },

  flat: {
    id: "flat",
    name: "Flat",
    description: "Clean solid colors without shadows or depth",

    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      h1: { size: "text-4xl md:text-5xl", weight: "font-bold", lineHeight: "leading-tight" },
      h2: { size: "text-2xl md:text-3xl", weight: "font-semibold", lineHeight: "leading-snug" },
      h3: { size: "text-lg md:text-xl", weight: "font-semibold", lineHeight: "leading-normal" },
      body: { size: "text-base", weight: "font-normal", lineHeight: "leading-relaxed" },
      small: { size: "text-sm", weight: "font-medium", lineHeight: "leading-normal" },
    },

    radius: {
      small: "rounded",
      medium: "rounded-md",
      large: "rounded-lg",
      full: "rounded-full",
    },

    shadows: {
      small: "",
      medium: "",
      large: "",
      glow: "",
    },

    components: {
      pageWrapper: "min-h-screen bg-gradient-to-br {background.page} px-4 py-12",
      container: "max-w-4xl mx-auto",
      card: "bg-{background.card} border border-{border} rounded-lg p-6",
      cardHover: "hover:border-{primary.base} transition-colors duration-200",
      button: {
        primary: "bg-{primary.base} hover:bg-{primary.hover} text-white font-semibold px-6 py-3 rounded-lg transition-colors",
        secondary: "bg-{background.muted} hover:bg-{border} text-{text.body} font-medium px-6 py-3 rounded-lg transition-colors",
        ghost: "text-{primary.base} hover:bg-{primary.light} font-medium px-6 py-3 rounded-lg transition-colors",
      },
      input: "bg-{background.card} border border-{border} text-{text.body} rounded-lg px-4 py-3 focus:outline-none focus:border-{primary.base} transition-colors placeholder:text-{text.muted}",
      listItem: "flex items-center gap-4 p-4 bg-{background.muted} border border-{border} rounded-lg hover:border-{primary.base} transition-colors",
      hero: {
        section: "py-8 md:py-12 bg-{background.muted}",
        content: "text-center max-w-xl md:max-w-2xl mx-auto px-4",
        badge: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-{primary.base} text-white text-xs font-semibold mb-4",
        eyebrow: "text-{primary.base} font-semibold tracking-wide uppercase text-xs mb-3",
        title: "text-2xl md:text-3xl lg:text-4xl font-bold text-{text.heading} leading-tight",
        titleAccent: "text-{primary.base}",
        divider: "w-16 h-0.5 bg-{primary.base} mx-auto mt-4",
        buttons: "flex flex-col sm:flex-row gap-3 justify-center mt-6",
      },
    },

    promptSnippet: `UI STYLE: FLAT
- Solid background colors only, NO transparency
- NO shadows, NO backdrop-blur effects
- Use borders for visual separation: "border border-gray-200"
- Simple rounded corners: rounded-md, rounded-lg
- Focus on color contrast for hierarchy
- Clean, minimal aesthetic
- Color-based hover states (border color changes)`,

    preview: {
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      blur: false,
    },
  },

  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Maximum whitespace, typography-focused",

    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      h1: { size: "text-5xl md:text-7xl", weight: "font-light", lineHeight: "leading-none" },
      h2: { size: "text-3xl md:text-4xl", weight: "font-light", lineHeight: "leading-tight" },
      h3: { size: "text-xl md:text-2xl", weight: "font-normal", lineHeight: "leading-snug" },
      body: { size: "text-lg", weight: "font-light", lineHeight: "leading-loose" },
      small: { size: "text-sm", weight: "font-normal", lineHeight: "leading-relaxed" },
    },

    radius: {
      small: "rounded",
      medium: "rounded",
      large: "rounded-md",
      full: "rounded-full",
    },

    shadows: {
      small: "",
      medium: "",
      large: "",
      glow: "",
    },

    components: {
      pageWrapper: "min-h-screen bg-{background.card} px-6 py-20",
      container: "max-w-2xl mx-auto",
      card: "py-12",
      cardHover: "",
      button: {
        primary: "bg-{text.heading} hover:bg-{text.body} text-{background.card} font-normal px-8 py-3 rounded transition-colors",
        secondary: "border border-{text.heading} hover:bg-{text.heading} hover:text-{background.card} text-{text.heading} font-normal px-8 py-3 rounded transition-colors",
        ghost: "text-{text.body} hover:text-{text.heading} font-normal px-4 py-2 transition-colors underline-offset-4 hover:underline",
      },
      input: "bg-transparent border-b border-{border} text-{text.body} py-3 focus:outline-none focus:border-{text.heading} transition-colors placeholder:text-{text.muted}",
      listItem: "flex items-center gap-6 py-6 border-b border-{border} last:border-0",
      hero: {
        section: "py-12 md:py-16",
        content: "text-center max-w-xl md:max-w-2xl mx-auto px-6",
        eyebrow: "text-{text.muted} tracking-[0.2em] uppercase text-xs mb-4",
        title: "text-2xl md:text-3xl lg:text-4xl font-light text-{text.heading} leading-tight tracking-tight",
        titleEmphasis: "font-normal italic",
        divider: "w-px h-8 bg-{border} mx-auto mt-6",
        buttons: "flex flex-col sm:flex-row gap-4 justify-center mt-6",
      },
    },

    promptSnippet: `UI STYLE: MINIMAL
- Maximum whitespace: generous padding (py-20, px-8)
- Typography-focused: larger text, lighter weights, more line-height
- NO heavy shadows or effects, NO borders on cards
- Borders only for inputs (bottom border) and list separators
- Limited visual elements - let content breathe
- Buttons: simple filled or outline style
- Narrow max-width containers (max-w-2xl)
- Understated elegance, Swiss design influence`,

    preview: {
      background: "#ffffff",
      border: "none",
      blur: false,
    },
  },

  neumorphic: {
    id: "neumorphic",
    name: "Neumorphic",
    description: "Soft UI with inset/outset shadows",

    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      h1: { size: "text-4xl md:text-5xl", weight: "font-semibold", lineHeight: "leading-tight" },
      h2: { size: "text-2xl md:text-3xl", weight: "font-semibold", lineHeight: "leading-snug" },
      h3: { size: "text-lg md:text-xl", weight: "font-medium", lineHeight: "leading-normal" },
      body: { size: "text-base", weight: "font-normal", lineHeight: "leading-relaxed" },
      small: { size: "text-sm", weight: "font-medium", lineHeight: "leading-normal" },
    },

    radius: {
      small: "rounded-xl",
      medium: "rounded-2xl",
      large: "rounded-3xl",
      full: "rounded-full",
    },

    shadows: {
      small: "shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff]",
      medium: "shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff]",
      large: "shadow-[12px_12px_24px_#d1d1d1,-12px_-12px_24px_#ffffff]",
      inset: "shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff]",
    },

    components: {
      pageWrapper: "min-h-screen bg-gray-100 px-4 py-12",
      container: "max-w-4xl mx-auto",
      card: "bg-gray-100 rounded-3xl shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] p-8",
      cardHover: "hover:shadow-[12px_12px_24px_#d1d1d1,-12px_-12px_24px_#ffffff] transition-shadow duration-300",
      button: {
        primary: "bg-gray-100 text-{primary.base} font-semibold px-6 py-3 rounded-xl shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#d1d1d1,-2px_-2px_4px_#ffffff] active:shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] transition-shadow",
        secondary: "bg-gray-100 text-{text.body} font-medium px-6 py-3 rounded-xl shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#d1d1d1,-2px_-2px_4px_#ffffff] transition-shadow",
        ghost: "text-{primary.base} font-medium px-6 py-3 rounded-xl hover:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] transition-shadow",
      },
      input: "bg-gray-100 text-{text.body} rounded-xl px-4 py-3 shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] focus:outline-none focus:ring-2 focus:ring-{primary.base}/30 placeholder:text-{text.muted}",
      listItem: "flex items-center gap-4 p-4 bg-gray-100 rounded-xl shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff]",
      hero: {
        section: "py-8 md:py-12 bg-gray-100",
        content: "text-center max-w-xl md:max-w-2xl mx-auto px-4",
        badge: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-{primary.base} text-xs font-medium mb-4 shadow-[3px_3px_6px_#d1d1d1,-3px_-3px_6px_#ffffff]",
        titleWrapper: "bg-gray-100 rounded-2xl shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] p-6 md:p-8 mb-4 inline-block",
        title: "text-2xl md:text-3xl lg:text-4xl font-semibold text-{text.heading} leading-tight",
        iconCircle: "w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center mx-auto mb-4",
        buttons: "flex flex-col sm:flex-row gap-3 justify-center mt-4",
      },
    },

    promptSnippet: `UI STYLE: NEUMORPHIC (Soft UI)
- Background MUST be soft gray: bg-gray-100 or bg-slate-200
- Cards: rounded-3xl with dual shadows shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff]
- Buttons: outset shadow, pressed state uses inset shadow
- Inputs: inset shadow for "pressed" appearance
- NO hard borders - use shadows for all definition
- Soft, tactile, 3D feel
- All elements same background color as page`,

    preview: {
      background: "#e5e7eb",
      boxShadow: "8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff",
      blur: false,
    },
  },

  brutalist: {
    id: "brutalist",
    name: "Brutalist",
    description: "Bold borders, high contrast, no rounded corners",

    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      h1: { size: "text-6xl md:text-8xl", weight: "font-black", lineHeight: "leading-none" },
      h2: { size: "text-4xl md:text-5xl", weight: "font-black", lineHeight: "leading-tight" },
      h3: { size: "text-2xl md:text-3xl", weight: "font-bold", lineHeight: "leading-snug" },
      body: { size: "text-base", weight: "font-normal", lineHeight: "leading-relaxed" },
      small: { size: "text-sm", weight: "font-bold", lineHeight: "leading-normal" },
    },

    radius: {
      small: "rounded-none",
      medium: "rounded-none",
      large: "rounded-none",
      full: "rounded-none",
    },

    shadows: {
      small: "",
      medium: "shadow-[4px_4px_0_0_black]",
      large: "shadow-[8px_8px_0_0_black]",
      glow: "",
    },

    components: {
      pageWrapper: "min-h-screen bg-{background.card} px-4 py-12",
      container: "max-w-5xl mx-auto",
      card: "bg-{background.card} border-4 border-{text.heading} p-8",
      cardHover: "hover:shadow-[8px_8px_0_0_black] hover:-translate-x-1 hover:-translate-y-1 transition-all",
      button: {
        primary: "bg-{text.heading} hover:bg-{background.card} text-{background.card} hover:text-{text.heading} font-black uppercase tracking-wider px-8 py-4 border-4 border-{text.heading} transition-colors",
        secondary: "bg-{background.card} hover:bg-{text.heading} text-{text.heading} hover:text-{background.card} font-black uppercase tracking-wider px-8 py-4 border-4 border-{text.heading} transition-colors",
        ghost: "text-{text.heading} font-black uppercase tracking-wider px-4 py-2 border-b-4 border-transparent hover:border-{text.heading} transition-colors",
      },
      input: "bg-{background.card} border-4 border-{text.heading} text-{text.body} px-4 py-3 focus:outline-none focus:shadow-[4px_4px_0_0_black] placeholder:text-{text.muted}",
      listItem: "flex items-center gap-4 p-4 border-4 border-{text.heading} hover:shadow-[4px_4px_0_0_black] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all",
      hero: {
        section: "py-8 md:py-12 bg-{background.card} border-b-4 border-{text.heading}",
        content: "max-w-xl md:max-w-2xl mx-auto px-4",
        badge: "inline-block bg-{text.heading} text-{background.card} px-3 py-1 font-black uppercase tracking-widest text-xs mb-4",
        eyebrow: "text-{primary.base} font-black uppercase tracking-[0.15em] text-xs mb-2",
        title: "text-2xl md:text-3xl lg:text-4xl font-black uppercase leading-tight tracking-tight text-{text.heading}",
        titleAccent: "text-{primary.base}",
        decoration: "w-12 h-1 md:w-16 md:h-1.5 bg-{primary.base} mt-4",
        buttons: "flex flex-col sm:flex-row gap-3 mt-6",
      },
    },

    promptSnippet: `UI STYLE: BRUTALIST
- NO rounded corners anywhere: rounded-none
- Thick black borders: border-4 border-black
- High contrast only: black, white, ONE accent color
- Bold typography: font-black, uppercase, tracking-wider
- Hard offset shadows: shadow-[8px_8px_0_0_black]
- No gradients, no blur, no soft effects
- Raw, intentionally stark aesthetic
- Hover states: invert colors or add offset shadow`,

    preview: {
      background: "#ffffff",
      border: "4px solid #000000",
      blur: false,
    },
  },
};

export const DEFAULT_UI_STYLE = "glassmorphism";
