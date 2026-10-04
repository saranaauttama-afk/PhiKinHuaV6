import React from 'react';
import { View, Image, ImageSourcePropType, StyleSheet } from 'react-native';
import { pulpColors } from '../theme';
import { useGameSettings } from './Settings';

type Props = { source: ImageSourcePropType; sceneKey: string; children: React.ReactNode };
const WALK_MS = 2600;
const FADE_MS = 450;

/** A presentation-only camera; no callbacks dispatch rewards or game commands. */
export default function SceneArrival({ source, sceneKey, children }: Props) {
  const reducedMotion = useGameSettings(s => s.reducedMotion);
  const [frame, setFrame] = React.useState({ key: '', elapsed: 0 });
  React.useEffect(() => {
    if (reducedMotion) {
      setFrame({ key: sceneKey, elapsed: WALK_MS + FADE_MS });
      return;
    }
    let handle = 0;
    let start: number | undefined;
    setFrame({ key: sceneKey, elapsed: 0 });
    const draw = (timestamp: number) => {
      start ??= timestamp;
      const elapsed = Math.min(timestamp - start, WALK_MS + FADE_MS);
      // React commits the wrapper transform every frame. The previous native
      // Animated.Image path stayed static on the tested Android/Fabric build.
      setFrame({ key: sceneKey, elapsed });
      if (elapsed < WALK_MS + FADE_MS) handle = requestAnimationFrame(draw);
    };
    handle = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(handle);
  }, [sceneKey, reducedMotion]);
  const elapsed = frame.key === sceneKey ? frame.elapsed : 0;
  const travel = Math.min(elapsed / WALK_MS, 1);
  const opacity = reducedMotion ? 1 : Math.max(0, Math.min((elapsed - WALK_MS) / FADE_MS, 1));
  const ready = frame.key === sceneKey && (reducedMotion || elapsed >= WALK_MS + FADE_MS);
  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: pulpColors.sceneInk }}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [
        { scale: reducedMotion ? 1.04 : 1.04 + travel * .24 },
        { translateY: reducedMotion ? 0 : Math.sin(travel * Math.PI * 8) * 10 * (1 - travel * .35) },
      ] }]}>
        <Image source={source} resizeMode="cover" style={{width:'100%',height:'100%'}} />
      </View>
      <View pointerEvents={ready ? 'auto' : 'none'} accessibilityElementsHidden={!ready}
        importantForAccessibility={ready ? 'auto' : 'no-hide-descendants'} style={{flex:1,opacity}}>
        {children}
      </View>
    </View>
  );
}
