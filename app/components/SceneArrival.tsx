import React from 'react';
import { Animated, Easing, View, ImageSourcePropType, StyleSheet } from 'react-native';
import { pulpColors } from '../theme';
import { useGameSettings } from './Settings';

type Props = {
  source: ImageSourcePropType;
  sceneKey: string;
  children: React.ReactNode;
};

/** Visual transition only; animation callbacks never change game state. */
export default function SceneArrival({ source, sceneKey, children }: Props) {
  const reducedMotion = useGameSettings(s => s.reducedMotion);
  const progress = React.useRef(new Animated.Value(0)).current;
  const fade = React.useRef(new Animated.Value(0)).current;
  const [readyScene, setReadyScene] = React.useState<string | null>(null);
  const ready = readyScene === sceneKey;

  React.useEffect(() => {
    setReadyScene(null);
    progress.setValue(0);
    fade.setValue(0);
    const arrival = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: reducedMotion ? 0 : 2600, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: reducedMotion ? 0 : 450, useNativeDriver: true }),
    ]);
    arrival.start(({ finished }) => { if (finished) setReadyScene(sceneKey); });
    return () => arrival.stop();
  }, [sceneKey, reducedMotion, progress, fade]);

  return (
    <View style={{ flex: 1, overflow: 'hidden', backgroundColor: pulpColors.sceneInk }}>
      {/* The image is outside the fading UI and keeps its final camera transform. */}
      <Animated.Image
        source={source}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, {
          width: '100%', height: '100%',
          transform: [
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1.04, reducedMotion ? 1.04 : 1.28] }) },
            { translateY: progress.interpolate({ inputRange: [0, .12, .25, .37, .5, .62, .75, .87, 1], outputRange: reducedMotion ? [0,0,0,0,0,0,0,0,0] : [0, 10, -8, 10, -8, 10, -8, 6, 0] }) },
          ],
        }]}
      />
      <Animated.View
        pointerEvents={ready ? 'auto' : 'none'}
        accessibilityElementsHidden={!ready}
        importantForAccessibility={ready ? 'auto' : 'no-hide-descendants'}
        style={{ flex: 1, opacity: fade }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
