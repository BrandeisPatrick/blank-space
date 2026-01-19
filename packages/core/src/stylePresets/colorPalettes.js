// AI Generation Color Palettes
// Defines comprehensive color palette presets for AI-generated code styling

export const COLOR_PALETTES = {
  "dark-professional": {
    id: "dark-professional",
    name: "Dark Professional",
    description: "Clean dark interface with off-white text and subtle grey accents",
    colors: {
      primary: { base: "[#f9f9f9]", hover: "white", light: "[#1a1a1a]" },
      secondary: { base: "[#7e7e7e]", hover: "[#999999]", light: "[#1a1a1a]" },
      accent: { base: "[#f9f9f9]", hover: "white" },
      background: {
        page: "black",
        card: "[#1a1a1a]",
        muted: "[#2a2a2a]",
      },
      text: {
        heading: "[#f9f9f9]",
        body: "[#f9f9f9]",
        muted: "[#7e7e7e]",
      },
      status: {
        success: "emerald-500",
        error: "red-500",
        warning: "amber-500",
        info: "sky-500",
      },
      border: "[#1f1f1f]",
    },
    isDark: true,
    preview: ["#f9f9f9", "#7e7e7e", "#1a1a1a"],
  },
};

export const DEFAULT_COLOR_PALETTE = "dark-professional";
