import {describe, expect, it} from 'vitest';
import {isCardPlayDrag} from '../src/ui/cardDrag';

describe('battle card drag intent', () => {
  it('accepts deliberate short upward drags at both phone card sizes', () => {
    for (const height of [114, 134, 166]) {
      expect(isCardPlayDrag(0, -75, height)).toBe(true);
    }
  });

  it('accepts an upward diagonal beyond the old fixed horizontal cutoff', () => {
    expect(isCardPlayDrag(70, -125, 166)).toBe(true);
    expect(isCardPlayDrag(-70, -125, 166)).toBe(true);
    expect(isCardPlayDrag(30, -75, 114)).toBe(true);
  });

  it('does not play on a tap, sideways browse, downward drag or retracted drag', () => {
    for (const [x,y] of [[0,0], [4,-8], [95,-18], [-95,-18], [0,80], [0,-30]]) {
      expect(isCardPlayDrag(x,y,134)).toBe(false);
    }
  });

  it('requires finger travel beyond the decorative lift and scales with card height', () => {
    expect(isCardPlayDrag(0,-20,114)).toBe(false);
    expect(isCardPlayDrag(0,-43,114)).toBe(false);
    expect(isCardPlayDrag(0,-44,114)).toBe(true);
    expect(isCardPlayDrag(0,-57,166)).toBe(false);
    expect(isCardPlayDrag(0,-58,166)).toBe(true);
  });
});
