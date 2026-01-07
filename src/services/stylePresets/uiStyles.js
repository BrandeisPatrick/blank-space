// AI Generation UI Styles
// Defines comprehensive UI style presets with full design system for AI

export const UI_STYLES = {
  "dark-professional": {
    id: "dark-professional",
    name: "Dark Professional",
    description: "Clean dark interface with subtle depth and refined typography",

    // Typography
    typography: {
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      h1: { size: "text-4xl md:text-5xl", weight: "font-medium", lineHeight: "leading-tight" },
      h2: { size: "text-2xl md:text-3xl", weight: "font-medium", lineHeight: "leading-snug" },
      h3: { size: "text-lg md:text-xl", weight: "font-medium", lineHeight: "leading-normal" },
      body: { size: "text-base", weight: "font-normal", lineHeight: "leading-relaxed" },
      small: { size: "text-sm", weight: "font-normal", lineHeight: "leading-normal" },
    },

    // Border Radius - consistent 8px
    radius: {
      small: "rounded-lg",
      medium: "rounded-lg",
      large: "rounded-lg",
      full: "rounded-full",
    },

    // Shadows - subtle
    shadows: {
      small: "shadow-sm",
      medium: "shadow-md",
      large: "shadow-lg",
      glow: "",
    },

    // Component Patterns
    components: {
      pageWrapper: "min-h-screen bg-black px-4 py-12",
      container: "max-w-4xl mx-auto",
      card: "bg-[#1a1a1a] border border-[#1f1f1f] rounded-lg p-6",
      cardHover: "hover:border-[#333333] transition-colors duration-200",
      button: {
        primary: "bg-[#f9f9f9] hover:bg-white text-black font-medium px-6 py-3 rounded-lg transition-colors",
        secondary: "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#f9f9f9] font-normal px-6 py-3 rounded-lg border border-[#1f1f1f] transition-colors",
        ghost: "text-[#7e7e7e] hover:text-[#f9f9f9] font-normal px-6 py-3 rounded-lg transition-colors",
      },
      input: "bg-[#1a1a1a] border border-[#1f1f1f] text-[#f9f9f9] rounded-lg px-4 py-3 focus:outline-none focus:border-[#333333] transition-colors placeholder:text-[#666666]",
      listItem: "flex items-center gap-4 p-4 bg-[#1a1a1a] border border-[#1f1f1f] rounded-lg hover:border-[#333333] transition-colors",
      hero: {
        section: "py-8 md:py-12 bg-black",
        content: "text-center max-w-xl md:max-w-2xl mx-auto px-4",
        badge: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#1f1f1f] text-[#7e7e7e] text-xs font-normal mb-4",
        eyebrow: "text-[#7e7e7e] font-medium tracking-wide uppercase text-xs mb-3",
        title: "text-2xl md:text-3xl lg:text-4xl font-medium text-[#f9f9f9] leading-tight",
        titleAccent: "text-[#f9f9f9]",
        divider: "w-16 h-px bg-[#1f1f1f] mx-auto mt-4",
        buttons: "flex flex-col sm:flex-row gap-3 justify-center mt-6",
      },
    },

    promptSnippet: `UI STYLE: DARK PROFESSIONAL
- Pure black background: bg-black or bg-[#000000]
- Cards/panels: bg-[#1a1a1a] with border border-[#1f1f1f]
- Primary text: text-[#f9f9f9] (off-white)
- Secondary text: text-[#7e7e7e] (medium grey)
- Tertiary/placeholder text: text-[#666666]
- Consistent rounded corners: rounded-lg (8px)
- Font weights: font-normal (400) and font-medium (500) only - NO bold/semibold
- Subtle borders for separation, no heavy shadows
- Clean, professional aesthetic with refined typography`,

    preview: {
      background: "#000000",
      border: "1px solid #1f1f1f",
      blur: false,
    },
  },
};

export const DEFAULT_UI_STYLE = "dark-professional";
