/** Finger travel only: the decorative card lift does not count toward playing. */
export function isCardPlayDrag(translationX: number, translationY: number, cardHeight: number): boolean {
  'worklet';
  const upward = -translationY;
  const distance = Math.max(44, Math.min(58, cardHeight * 0.35));
  // Allow a natural diagonal toward the enemy, while rejecting sideways browsing.
  return upward >= distance && upward >= Math.abs(translationX);
}
