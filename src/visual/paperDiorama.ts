/** Presentation only. No gameplay state, rewards or saved progression. */
export const PAPER_PUSH_MS = 1600;
export const PAPER_GHOST_ID = 'phi-nang-yai';
export const PAPER_LAYERS = {
  sky: { drift: 0.7, push: 0, rise: 0, shadow: 0 },
  forest: { drift: 2.1, push: 0.018, rise: -3, shadow: 3 },
  village: { drift: 4, push: 0.045, rise: 5, shadow: 5 },
  ghost: { drift: 5.5, push: 0.28, rise: -30, shadow: 7 },
  foliage: { drift: 7, push: 0.085, rise: 9, shadow: 8 },
} as const;
export type PaperLayerId = keyof typeof PAPER_LAYERS;
export function paperProjection(id: PaperLayerId, progress: number, x = 0, y = 0) {
  'worklet';
  const p = Math.max(0, Math.min(1, progress)), layer = PAPER_LAYERS[id];
  return {
    scale: (id === 'ghost' ? 0.72 : 1) + p * layer.push,
    translateX: x * layer.drift,
    translateY: y * layer.drift * 0.35 + (id === 'ghost' ? 30 : 0) + p * layer.rise,
  };
}
