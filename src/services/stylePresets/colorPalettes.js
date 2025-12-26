// AI Generation Color Palettes
// Defines comprehensive color palette presets for AI-generated code styling

export const COLOR_PALETTES = {
  matchWallpaper: {
    id: "matchWallpaper",
    name: "Match Wallpaper",
    description: "Derives colors from your selected wallpaper theme",
    isSpecial: true,
    preview: null,
  },

  corporate: {
    id: "corporate",
    name: "Corporate",
    description: "Modern slate and warm stone accents",
    colors: {
      primary: { base: "slate-700", hover: "slate-800", light: "slate-100" },
      secondary: { base: "stone-500", hover: "stone-600", light: "stone-100" },
      accent: { base: "sky-500", hover: "sky-600" },
      background: {
        page: "from-stone-50 via-white to-slate-50",
        card: "white",
        muted: "stone-50",
      },
      text: {
        heading: "slate-900",
        body: "slate-700",
        muted: "slate-500",
      },
      status: {
        success: "emerald-500",
        error: "red-500",
        warning: "amber-500",
        info: "sky-500",
      },
      border: "stone-200",
    },
    isDark: false,
    preview: ["#334155", "#78716c", "#0ea5e9"],
  },

  vibrant: {
    id: "vibrant",
    name: "Vibrant",
    description: "Deep indigo with warm rose accents",
    colors: {
      primary: { base: "indigo-500", hover: "indigo-400", light: "indigo-950" },
      secondary: { base: "violet-600", hover: "violet-500", light: "violet-950" },
      accent: { base: "rose-400", hover: "rose-300" },
      background: {
        page: "from-slate-900 via-indigo-950 to-slate-900",
        card: "slate-800/40",
        muted: "slate-800/60",
      },
      text: {
        heading: "white",
        body: "slate-300",
        muted: "slate-400",
      },
      status: {
        success: "emerald-400",
        error: "rose-400",
        warning: "amber-400",
        info: "indigo-400",
      },
      border: "slate-700/50",
    },
    isDark: true,
    preview: ["#6366f1", "#7c3aed", "#fb7185"],
  },

  nature: {
    id: "nature",
    name: "Nature",
    description: "Sage green with warm terracotta tones",
    colors: {
      primary: { base: "green-700", hover: "green-800", light: "green-100" },
      secondary: { base: "amber-700", hover: "amber-800", light: "amber-100" },
      accent: { base: "teal-600", hover: "teal-700" },
      background: {
        page: "from-stone-50 via-white to-green-50",
        card: "white",
        muted: "stone-50",
      },
      text: {
        heading: "stone-900",
        body: "stone-700",
        muted: "stone-500",
      },
      status: {
        success: "green-600",
        error: "red-500",
        warning: "amber-600",
        info: "teal-500",
      },
      border: "stone-200",
    },
    isDark: false,
    preview: ["#4d7c4d", "#c97c5d", "#0d9488"],
  },

  sunset: {
    id: "sunset",
    name: "Sunset",
    description: "Muted coral with dusty rose warmth",
    colors: {
      primary: { base: "orange-600", hover: "orange-700", light: "orange-100" },
      secondary: { base: "rose-400", hover: "rose-500", light: "rose-100" },
      accent: { base: "amber-500", hover: "amber-600" },
      background: {
        page: "from-rose-50 via-white to-orange-50",
        card: "white",
        muted: "rose-50",
      },
      text: {
        heading: "stone-900",
        body: "stone-700",
        muted: "stone-500",
      },
      status: {
        success: "emerald-500",
        error: "red-500",
        warning: "amber-500",
        info: "orange-500",
      },
      border: "rose-200",
    },
    isDark: false,
    preview: ["#e07a5f", "#d4a5a5", "#f59e0b"],
  },

  monochrome: {
    id: "monochrome",
    name: "Monochrome",
    description: "Elegant warm neutrals",
    colors: {
      primary: { base: "neutral-800", hover: "neutral-900", light: "neutral-100" },
      secondary: { base: "stone-500", hover: "stone-600", light: "stone-200" },
      accent: { base: "stone-400", hover: "stone-500" },
      background: {
        page: "from-stone-50 via-white to-neutral-50",
        card: "white",
        muted: "stone-50",
      },
      text: {
        heading: "neutral-900",
        body: "neutral-700",
        muted: "neutral-500",
      },
      status: {
        success: "neutral-700",
        error: "neutral-900",
        warning: "neutral-600",
        info: "neutral-500",
      },
      border: "stone-200",
    },
    isDark: false,
    preview: ["#262626", "#78716c", "#a8a29e"],
  },
};

export const DEFAULT_COLOR_PALETTE = "matchWallpaper";
