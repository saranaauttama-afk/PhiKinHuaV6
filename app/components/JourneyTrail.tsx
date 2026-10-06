import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { GameState } from '../../src/core/types';
import RitualSurface, { chalk } from './RitualSurface';
import { font, ritualColors } from '../theme';

const routeArt = {
  ghost: require('../../assets/ui/trail-ghost.png'),
  rest: require('../../assets/ui/trail-rest.png'),
  house: require('../../assets/ui/trail-house.png'),
};
export default function JourneyTrail({ state }: { state: GameState }) {
  const j = state.journey;
  const { width } = useWindowDimensions();
  const [trailWidth, setTrailWidth] = React.useState(width - 64);
  const scroll = React.useRef<ScrollView>(null);
  const row = j?.currentId ? (j.nodes[j.currentId]?.row ?? 0) + 1 : 0;
  const nodeWidth = Math.max(54, trailWidth / Math.min(j?.rows.length || 1, 5));
  React.useEffect(() => {
    scroll.current?.scrollTo({ x: Math.max(0, (row - 2) * nodeWidth), animated: true });
  }, [row, nodeWidth]);
  if (!j) return null;
  const fights = j.plans.filter(p => p.kind !== 'rest').length;
  const done = j.plans.slice(0, row).filter(p => p.kind !== 'rest').length;
  return <RitualSurface kind="slate" style={styles.slate}>
    <Text style={styles.heading}>เส้นทาง · ศึกที่ {Math.min(done + 1, fights)} จาก {fights}</Text>
    <View onLayout={e => setTrailWidth(e.nativeEvent.layout.width)}>
      <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trail}>
        {j.rows.map((_, i) => {
          const plan = j.plans[i];
          const current = i === row;
          const past = i < row;
          const rest = plan?.kind === 'rest';
          const finale = plan?.kind === 'boss' || (!rest && i === j.rows.length - 1);
          const label = rest ? 'พัก' : `ศึก ${plan && 'fightIndex' in plan ? plan.fightIndex : ''}`;
          return <View key={i} accessible accessibilityLabel={label + (current ? ' อยู่ที่นี่' : past ? ' ผ่านแล้ว' : '')}
            style={[styles.node, { width: nodeWidth, paddingTop: i % 2 ? 6 : 0 }]}>
            {i < j.rows.length - 1 && <View pointerEvents="none" style={{ position: 'absolute', left: nodeWidth / 2, top: 22 }}>
              <Svg width={nodeWidth} height={30}><Path d={i % 2 ? `M0 16Q${nodeWidth / 2} -2 ${nodeWidth} 8` : `M0 8Q${nodeWidth / 2} 28 ${nodeWidth} 16`}
                stroke={chalk} strokeWidth={1.5} fill="none" strokeDasharray="3 3" /></Svg>
            </View>}
            {/* Advancing the selected node changes border/opacity during navigation.
                Keep the icon parent mounted so Fabric never reparents its image. */}
            <View collapsable={false} style={[styles.illustration, { borderWidth: current ? 2 : 0, opacity: past ? .45 : current ? 1 : .75 }]}>
              <Image accessible={false} source={routeArt[rest ? 'rest' : finale ? 'house' : 'ghost']} resizeMode="contain" style={styles.icon} />
            </View>
            <Text style={styles.label}>{label}</Text>
            {current && <Text style={styles.current}>อยู่ที่นี่</Text>}
          </View>;
        })}
      </ScrollView>
    </View>
  </RitualSurface>;
}
const styles = StyleSheet.create({
  slate: { marginHorizontal: 12, paddingHorizontal: 20, paddingVertical: 14, marginBottom: 4 },
  heading: { fontFamily: font.ui, color: chalk, fontSize: 11 },
  trail: { height: 96, paddingTop: 6 },
  node: { alignItems: 'center' },
  illustration: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 26, borderColor: ritualColors.circle },
  icon: { width: 44, height: 44 },
  label: { fontFamily: font.ui, color: chalk, fontSize: 10, marginTop: 2 },
  current: { fontFamily: font.heading, color: ritualColors.label, fontSize: 9 },
});
