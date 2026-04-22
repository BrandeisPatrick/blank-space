/**
 * React Native variant of modelConfig.
 *
 * Metro auto-selects this over modelConfig.js on iOS/Android. The web
 * variant uses `import.meta.env` (Vite syntax) which Metro's Babel
 * cannot parse — even guarded by `typeof`, the AST still fails. This
 * file re-exports only what the RN app actually uses (MODEL_TIERS,
 * getModelForTier, isGeminiModel) and skips the Vite/Node env lookups
 * entirely. The full MODEL_CONFIGS / per-agent overrides aren't needed
 * on mobile because agent orchestration still runs server-side.
 */

export const MODEL_TIERS = {
  lite: {
    id: 'gemini-3-flash-preview',
    name: 'Bina Lite',
    description: 'Fast',
  },
  pro: {
    id: 'gemini-3-pro-preview',
    name: 'Bina Pro',
    description: 'Most capable',
  },
};

export function getModelForTier(tier) {
  return MODEL_TIERS[tier]?.id || MODEL_TIERS.lite.id;
}

export function isGeminiModel(model) {
  return typeof model === 'string' && model.startsWith('gemini-');
}
