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
    description: "Professional blues and grays",
    colors: {
      primary: { base: "blue-600", hover: "blue-700", light: "blue-100" },
      secondary: { base: "gray-600", hover: "gray-700", light: "gray-100" },
      accent: { base: "blue-500", hover: "blue-600" },
      background: {
        page: "from-slate-50 via-white to-blue-50",
        card: "white",
        muted: "gray-50",
      },
      text: {
        heading: "gray-900",
        body: "gray-700",
        muted: "gray-500",
      },
      status: {
        success: "emerald-500",
        error: "red-500",
        warning: "amber-500",
        info: "blue-500",
      },
      border: "gray-200",
    },
    isDark: false,
    preview: ["#2563EB", "#4B5563", "#3B82F6"],
  },

  vibrant: {
    id: "vibrant",
    name: "Vibrant",
    description: "Bold cyan and purple gradients",
    colors: {
      primary: { base: "cyan-500", hover: "cyan-400", light: "cyan-950" },
      secondary: { base: "purple-600", hover: "purple-500", light: "purple-950" },
      accent: { base: "pink-500", hover: "pink-400" },
      background: {
        page: "from-slate-900 via-purple-900 to-slate-900",
        card: "slate-800/40",
        muted: "slate-800/60",
      },
      text: {
        heading: "white",
        body: "gray-300",
        muted: "gray-400",
      },
      status: {
        success: "emerald-400",
        error: "red-400",
        warning: "amber-400",
        info: "cyan-400",
      },
      border: "slate-700/50",
    },
    isDark: true,
    preview: ["#06B6D4", "#9333EA", "#EC4899"],
  },

  nature: {
    id: "nature",
    name: "Nature",
    description: "Earthy greens and warm browns",
    colors: {
      primary: { base: "emerald-600", hover: "emerald-700", light: "emerald-100" },
      secondary: { base: "amber-600", hover: "amber-700", light: "amber-100" },
      accent: { base: "lime-500", hover: "lime-600" },
      background: {
        page: "from-green-50 via-white to-amber-50",
        card: "white",
        muted: "green-50",
      },
      text: {
        heading: "gray-900",
        body: "gray-700",
        muted: "gray-500",
      },
      status: {
        success: "emerald-500",
        error: "red-500",
        warning: "amber-500",
        info: "teal-500",
      },
      border: "green-200",
    },
    isDark: false,
    preview: ["#059669", "#D97706", "#84CC16"],
  },

  sunset: {
    id: "sunset",
    name: "Sunset",
    description: "Warm oranges and pinks",
    colors: {
      primary: { base: "orange-500", hover: "orange-600", light: "orange-100" },
      secondary: { base: "rose-500", hover: "rose-600", light: "rose-100" },
      accent: { base: "amber-400", hover: "amber-500" },
      background: {
        page: "from-orange-50 via-white to-rose-50",
        card: "white",
        muted: "orange-50",
      },
      text: {
        heading: "gray-900",
        body: "gray-700",
        muted: "gray-500",
      },
      status: {
        success: "emerald-500",
        error: "red-500",
        warning: "amber-500",
        info: "orange-500",
      },
      border: "orange-200",
    },
    isDark: false,
    preview: ["#F97316", "#F43F5E", "#FBBF24"],
  },

  monochrome: {
    id: "monochrome",
    name: "Monochrome",
    description: "Clean black and white with gray accents",
    colors: {
      primary: { base: "gray-900", hover: "gray-800", light: "gray-100" },
      secondary: { base: "gray-600", hover: "gray-700", light: "gray-200" },
      accent: { base: "gray-400", hover: "gray-500" },
      background: {
        page: "from-gray-50 via-white to-gray-100",
        card: "white",
        muted: "gray-50",
      },
      text: {
        heading: "gray-900",
        body: "gray-700",
        muted: "gray-500",
      },
      status: {
        success: "gray-700",
        error: "gray-900",
        warning: "gray-600",
        info: "gray-500",
      },
      border: "gray-200",
    },
    isDark: false,
    preview: ["#111827", "#4B5563", "#9CA3AF"],
  },
};

export const DEFAULT_COLOR_PALETTE = "matchWallpaper";
