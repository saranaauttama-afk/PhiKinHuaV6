import {useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {battleGeometry} from '../../battleGeometry';
export type BattleLayout=ReturnType<typeof battleGeometry>;
export function useBattleLayout():BattleLayout {
 const {width,height}=useWindowDimensions();const safe=useSafeAreaInsets();
 return battleGeometry(width,height,safe.top,safe.bottom);
}
