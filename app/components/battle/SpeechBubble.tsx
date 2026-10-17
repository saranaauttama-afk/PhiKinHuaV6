// app/components/battle/SpeechBubble.tsx — a comic speech balloon: a hand-drawn oval with a tail.
//
// Owner 17 Oct 2026: the ghost's line and our answers should read like comic balloons (round,
// slightly wobbly ovals) instead of rounded rectangles. The oval is an SVG path sized from the
// measured text box, so it stretches with long or short lines; the text keeps a generous inner
// padding so it stays inside the curve.
import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Tail = 'up' | 'down-left' | 'down-right' | 'none';

/** Oval through the four edge midpoints, nudged a little so it looks drawn by hand (or the tail alone). */
function balloonPath(w: number, h: number, tail: Tail): string {
  if (tail !== 'none') return tailPath(w, h, tail);
  const cx = w / 2, cy = h / 2, rx = w / 2 - 2, ry = h / 2 - 2, k = 0.56;
  const top = cy - ry, bottom = cy + ry, left = cx - rx, right = cx + rx;
  const wob = Math.min(4, h * 0.04);
  // Four cubic arcs; the slight offsets break the perfect ellipse.
  let d = `M ${left} ${cy}`;
  d += ` C ${left} ${cy - ry * k - wob} ${cx - rx * k} ${top} ${cx} ${top}`;
  d += ` C ${cx + rx * k + wob} ${top} ${right} ${cy - ry * k} ${right} ${cy}`;
  d += ` C ${right} ${cy + ry * k + wob} ${cx + rx * k} ${bottom} ${cx} ${bottom}`;
  d += ` C ${cx - rx * k - wob} ${bottom} ${left} ${cy + ry * k} ${left} ${cy} Z`;
  return d;
}

/** The tail alone: a curved wedge that starts inside the oval so the oval drawn over it hides its base. */
function tailPath(w: number, h: number, tail: Tail): string {
  if (tail === 'up') {
    const cx = w / 2, tw = Math.min(22, w * 0.07), base = 5;
    return `M ${cx - tw} ${base} Q ${cx - 4} ${-2} ${cx + 6} ${-17} Q ${cx + 6} ${0} ${cx + tw} ${base} Z`;
  }
  const x = tail === 'down-left' ? w * 0.24 : w * 0.76, dir = tail === 'down-left' ? -1 : 1, tw = Math.min(14, w * 0.05), base = h - 4;
  return `M ${x - tw} ${base} Q ${x + dir * 2} ${h + 2} ${x + dir * 16} ${h + 12} Q ${x + dir * 4} ${h - 2} ${x + tw} ${base} Z`;
}

export default function SpeechBubble({ children, tail = 'none', fill, stroke, style, testID }: {
  children: React.ReactNode; tail?: Tail; fill: string; stroke: string; style?: ViewStyle; testID?: string;
}) {
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);
  // Room for the tail lives inside this component (no negative offsets: some parents clip them).
  const above = tail === 'up' ? 18 : 0, below = tail === 'down-left' || tail === 'down-right' ? 14 : 0;
  return (
    <View testID={testID} style={{ alignSelf: style?.alignSelf ?? 'stretch', paddingTop: above, paddingBottom: below }}>
      {size && <Svg pointerEvents="none" width={size.w} height={size.h + above + below} style={{ position: 'absolute', left: 0, top: 0 }}
        viewBox={`0 ${-above} ${size.w} ${size.h + above + below}`}>
        {/* tail first (filled and outlined), then the oval on top so the tail grows out of it */}
        {tail !== 'none' && <Path d={balloonPath(size.w, size.h, tail)} fill={fill} stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />}
        <Path d={balloonPath(size.w, size.h, 'none')} fill={fill} stroke={stroke} strokeWidth={1.5} />
      </Svg>}
      <View style={style} onLayout={e => { const { width, height } = e.nativeEvent.layout; if (!size || Math.abs(size.w - width) > 1 || Math.abs(size.h - height) > 1) setSize({ w: width, h: height }); }}>
        {children}
      </View>
    </View>
  );
}
