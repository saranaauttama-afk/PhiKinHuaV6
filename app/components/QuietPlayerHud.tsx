import React from 'react';
import {Image,Pressable,Text,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import RitualSurface,{chalk} from './RitualSurface';
import HealthBar from './HealthBar';
import InkIcon,{type InkSymbol} from './InkIcon';
import {font,layer} from '../theme';
export const playerPortraits:Record<string,number>={warrior:require('../../assets/ui/battle-portraits/warrior.png'),shaman:require('../../assets/ui/battle-portraits/shaman.png'),nun:require('../../assets/ui/battle-portraits/nun.png'),medium:require('../../assets/ui/battle-portraits/medium.png')};
export function HudStat({icon,text,onPress,label}:{icon:InkSymbol;text:string;onPress?:()=>void;label?:string}){
 const content=<><InkIcon name={icon} size={16} color={chalk}/><Text style={{fontFamily:font.heading,fontSize:12,color:chalk}}>{text}</Text></>;
 return onPress?<Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{minHeight:44,flexDirection:'row',gap:3,alignItems:'center'}}>{content}</Pressable>:<View accessible accessibilityLabel={label} style={{minHeight:44,flexDirection:'row',gap:3,alignItems:'center'}}>{content}</View>;
}
export default function QuietPlayerHud({classId,hp,maxHp,onPortrait,stats,action,extras,blessings}:{classId?:string;hp:number;maxHp:number;onPortrait?:()=>void;stats:React.ReactNode;action?:React.ReactNode;extras?:React.ReactNode;blessings?:React.ReactNode}){
 const pad=useSafeAreaInsets();
 return <View testID="player-hud" pointerEvents="box-none" style={{position:'absolute',bottom:pad.bottom+4,left:8,right:8,zIndex:layer.statusBar}}>
  <RitualSurface kind="quietSlate" style={{height:extras||blessings?114:88,paddingHorizontal:8,paddingVertical:6,gap:2}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:8,flex:1}}>
    <Pressable disabled={!onPortrait} accessibilityRole="button" accessibilityLabel="ข้อมูลผู้เดินทาง" onPress={onPortrait} style={{width:40,height:64}}><Image accessible={false} source={playerPortraits[classId??'shaman']} resizeMode="contain" style={{width:40,height:64}}/></Pressable>
    <View style={{flex:1,gap:2}}><HealthBar hp={hp} maxHp={maxHp} compact/><View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',gap:14}}>{stats}</View></View>
    {action}
   </View>
   {(extras||blessings)&&<View style={{height:36,flexDirection:'row',alignItems:'center',gap:4}}><View style={{flex:2,flexDirection:'row',gap:2,alignItems:'center',minWidth:0}}>{extras}</View>{blessings&&<View style={{flex:1,minWidth:0}}>{blessings}</View>}</View>}
  </RitualSurface>
 </View>;
}
