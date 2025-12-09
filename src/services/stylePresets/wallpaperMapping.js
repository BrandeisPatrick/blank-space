// Wallpaper to AI Palette Mapping
// Derives comprehensive AI color palettes from wallpaper theme selections

/**
 * Maps wallpaper themes to full color palettes for AI generation
 * @param {string} themeKey - The wallpaper theme key (e.g., 'starry', 'ocean')
 * @param {boolean} isDark - Whether the theme is dark mode
 * @returns {Object} Full color palette configuration for the AI prompt
 */
export function deriveColorsFromWallpaper(themeKey, isDark = true) {
  const mappings = {
    starry: {
      primary: { base: "purple-500", hover: "purple-400", light: "purple-950" },
      secondary: { base: "blue-500", hover: "blue-400", light: "blue-950" },
      accent: { base: "pink-400", hover: "pink-300" },
      background: {
        page: "from-slate-900 via-purple-950 to-slate-900",
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
        info: "purple-400",
      },
      border: "purple-500/30",
      isDark: true,
    },

    christmas: {
      primary: { base: "red-600", hover: "red-700", light: "red-100" },
      secondary: { base: "green-600", hover: "green-700", light: "green-100" },
      accent: { base: "amber-400", hover: "amber-500" },
      background: {
        page: isDark ? "from-slate-900 via-green-950 to-red-950" : "from-red-50 via-white to-green-50",
        card: isDark ? "slate-800/40" : "white",
        muted: isDark ? "slate-800/60" : "red-50",
      },
      text: {
        heading: isDark ? "white" : "gray-900",
        body: isDark ? "gray-300" : "gray-700",
        muted: isDark ? "gray-400" : "gray-500",
      },
      status: {
        success: "green-500",
        error: "red-500",
        warning: "amber-500",
        info: "green-500",
      },
      border: isDark ? "green-500/30" : "green-200",
      isDark,
    },

    newyear: {
      primary: { base: "red-500", hover: "red-600", light: "red-100" },
      secondary: { base: "amber-500", hover: "amber-600", light: "amber-100" },
      accent: { base: "green-500", hover: "green-600" },
      background: {
        page: isDark ? "from-slate-900 via-red-950 to-amber-950" : "from-red-50 via-white to-amber-50",
        card: isDark ? "slate-800/40" : "white",
        muted: isDark ? "slate-800/60" : "amber-50",
      },
      text: {
        heading: isDark ? "white" : "gray-900",
        body: isDark ? "gray-300" : "gray-700",
        muted: isDark ? "gray-400" : "gray-500",
      },
      status: {
        success: "emerald-500",
        error: "red-500",
        warning: "amber-500",
        info: "amber-500",
      },
      border: isDark ? "amber-500/30" : "amber-200",
      isDark,
    },

    ocean: {
      primary: { base: "cyan-500", hover: "cyan-400", light: "cyan-950" },
      secondary: { base: "blue-600", hover: "blue-500", light: "blue-950" },
      accent: { base: "teal-400", hover: "teal-300" },
      background: {
        page: "from-slate-900 via-blue-950 to-cyan-950",
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
      border: "cyan-500/30",
      isDark: true,
    },

    aurora: {
      primary: { base: "green-400", hover: "green-300", light: "green-950" },
      secondary: { base: "cyan-500", hover: "cyan-400", light: "cyan-950" },
      accent: { base: "purple-500", hover: "purple-400" },
      background: {
        page: "from-slate-900 via-emerald-950 to-cyan-950",
        card: "slate-800/40",
        muted: "slate-800/60",
      },
      text: {
        heading: "white",
        body: "gray-300",
        muted: "gray-400",
      },
      status: {
        success: "green-400",
        error: "red-400",
        warning: "amber-400",
        info: "cyan-400",
      },
      border: "green-500/30",
      isDark: true,
    },

    sunset: {
      primary: { base: "orange-500", hover: "orange-400", light: "orange-950" },
      secondary: { base: "pink-500", hover: "pink-400", light: "pink-950" },
      accent: { base: "amber-400", hover: "amber-300" },
      background: {
        page: "from-slate-900 via-orange-950 to-pink-950",
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
        info: "orange-400",
      },
      border: "orange-500/30",
      isDark: true,
    },

    lavender: {
      primary: { base: "purple-500", hover: "purple-600", light: "purple-100" },
      secondary: { base: "indigo-500", hover: "indigo-600", light: "indigo-100" },
      accent: { base: "violet-400", hover: "violet-500" },
      background: {
        page: "from-purple-50 via-white to-indigo-50",
        card: "white",
        muted: "purple-50",
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
        info: "purple-500",
      },
      border: "purple-200",
      isDark: false,
    },

    rose: {
      primary: { base: "rose-500", hover: "rose-600", light: "rose-100" },
      secondary: { base: "pink-500", hover: "pink-600", light: "pink-100" },
      accent: { base: "red-400", hover: "red-500" },
      background: {
        page: "from-rose-50 via-white to-pink-50",
        card: "white",
        muted: "rose-50",
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
        info: "rose-500",
      },
      border: "rose-200",
      isDark: false,
    },

    mint: {
      primary: { base: "emerald-500", hover: "emerald-600", light: "emerald-100" },
      secondary: { base: "teal-500", hover: "teal-600", light: "teal-100" },
      accent: { base: "green-400", hover: "green-500" },
      background: {
        page: "from-emerald-50 via-white to-teal-50",
        card: "white",
        muted: "emerald-50",
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
      border: "emerald-200",
      isDark: false,
    },

    sky: {
      primary: { base: "sky-500", hover: "sky-600", light: "sky-100" },
      secondary: { base: "blue-500", hover: "blue-600", light: "blue-100" },
      accent: { base: "cyan-400", hover: "cyan-500" },
      background: {
        page: "from-sky-50 via-white to-blue-50",
        card: "white",
        muted: "sky-50",
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
        info: "sky-500",
      },
      border: "sky-200",
      isDark: false,
    },

    sand: {
      primary: { base: "amber-600", hover: "amber-700", light: "amber-100" },
      secondary: { base: "orange-500", hover: "orange-600", light: "orange-100" },
      accent: { base: "yellow-500", hover: "yellow-600" },
      background: {
        page: "from-amber-50 via-white to-orange-50",
        card: "white",
        muted: "amber-50",
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
        info: "amber-500",
      },
      border: "amber-200",
      isDark: false,
    },

    cream: {
      primary: { base: "amber-500", hover: "amber-600", light: "amber-100" },
      secondary: { base: "orange-400", hover: "orange-500", light: "orange-100" },
      accent: { base: "yellow-400", hover: "yellow-500" },
      background: {
        page: "from-amber-50 via-white to-yellow-50",
        card: "white",
        muted: "amber-50",
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
        info: "amber-500",
      },
      border: "amber-200",
      isDark: false,
    },
  };

  const colors = mappings[themeKey];

  if (!colors) {
    // Fallback to vibrant dark theme
    return {
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
      isDark: true,
      themeName: "Default",
    };
  }

  return {
    ...colors,
    themeName: themeKey.charAt(0).toUpperCase() + themeKey.slice(1),
  };
}
