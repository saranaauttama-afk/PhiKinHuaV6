import React from 'react';
import {AccessibilityInfo, AppState, Platform} from 'react-native';
import {useGameSettings} from '../Settings';

/** Honor the game's switch and live OS/browser accessibility changes. */
export function usePaperMotion() {
  const preference = useGameSettings(s => s.reducedMotion);
  const [systemReduced, setSystemReduced] = React.useState(false);
  const [active, setActive] = React.useState(true);
  React.useEffect(() => {
    let alive = true;
    if (Platform.OS === 'web') {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      const changed = () => setSystemReduced(query.matches);
      const visibility = () => setActive(!document.hidden);
      changed(); visibility();
      query.addEventListener('change', changed);
      document.addEventListener('visibilitychange', visibility);
      return () => {query.removeEventListener('change', changed); document.removeEventListener('visibilitychange', visibility);};
    }
    void AccessibilityInfo.isReduceMotionEnabled().then(v => {if (alive) setSystemReduced(v);});
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduced);
    const app = AppState.addEventListener('change', value => setActive(value === 'active'));
    return () => {alive = false; motion.remove(); app.remove();};
  }, []);
  return {reduced: preference || systemReduced, active};
}
