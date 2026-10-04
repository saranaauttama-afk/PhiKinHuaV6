import {pulpColors} from '../theme';
import React from 'react';
import { Image, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { font, palette, space } from '../theme';
import Paper, { paper } from './Paper';
import InkIcon from './InkIcon';
type Props={children?:React.ReactNode;title?:string;subtitle?:string;style?:StyleProp<ViewStyle>;emphasis?:boolean;padded?:boolean};
export default function Panel({children,title,subtitle,style,emphasis,padded=true}:Props){return <Paper style={[{padding:padded?16:0,borderWidth:emphasis?2:0,borderColor:paper.red},style]}>{title&&<Text style={{fontFamily:font.heading,color:paper.ink,fontSize:17,marginBottom:8}}>{title}</Text>}{children}{subtitle&&<Text style={{fontFamily:font.ui,color:paper.muted,fontSize:12,marginTop:8}}>{subtitle}</Text>}</Paper>;}
export function GameButton({label,onPress,tone='normal',disabled=false,style}:{label:string;onPress?:()=>void;tone?:'normal'|'primary'|'danger';disabled?:boolean;style?:StyleProp<ViewStyle>}){
 const [buttonWidth,setButtonWidth]=React.useState(0);
 return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} onLayout={e=>setButtonWidth(e.nativeEvent.layout.width)} style={({pressed})=>[{minHeight:64,opacity:disabled?.4:1,transform:[{translateY:pressed?2:0}],alignSelf:'stretch'},style]}>
 {buttonWidth>0&&<Image source={require('../../assets/ui/paper-button.png')} resizeMode="stretch" style={{position:'absolute',top:0,left:0,width:buttonWidth,height:64,opacity:tone==='primary'?1:.92}}/>}
 <View style={{height:64,paddingVertical:12,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8}}>
 {tone==='primary'&&<InkIcon name="lantern" size={20}/>}
 <Text style={{color:tone==='danger'?paper.red:paper.ink,fontSize:14,fontFamily:font.heading,textAlign:'center',flexShrink:1}}>{label}</Text></View></Pressable>;
}
export function Scrim({children,heavy=false,style}:{children?:React.ReactNode;heavy?:boolean;style?:StyleProp<ViewStyle>}){return <View style={[{flex:1,backgroundColor:heavy?palette.scrimHeavy:pulpColors.mapShade},style]}>{children}</View>;}
