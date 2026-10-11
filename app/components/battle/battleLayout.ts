import React from 'react';
import {useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {battleGeometry} from '../../battleGeometry';
export type BattleLayout=ReturnType<typeof battleGeometry>;
export const BattleLayoutContext=React.createContext<BattleLayout|null>(null);
export function useBattleLayout():BattleLayout {
 const {width,height}=useWindowDimensions();const safe=useSafeAreaInsets();
 const measured=React.useContext(BattleLayoutContext);
 return measured??battleGeometry(width,height,safe.top,safe.bottom);
}
