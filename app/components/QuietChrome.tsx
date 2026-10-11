import React from 'react';
import {ImageBackground,ImageSourcePropType,Pressable,ScrollView,StyleProp,Text,View,ViewStyle} from 'react-native';
import {font,palette,quietUiColors} from '../theme';
import {useScreenPadding} from '../useScreenPadding';
import RitualSurface from './RitualSurface';

export function QuietButton({label,onPress,disabled=false,primary=false,style}:{label:string;onPress?:()=>void;disabled?:boolean;primary?:boolean;style?:StyleProp<ViewStyle>}){
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress}
  style={({pressed})=>[{minHeight:48,opacity:disabled?.4:pressed?.75:1},style]}>
  <RitualSurface kind={primary?'hudPaper':'quietSlate'} style={{minHeight:48,paddingHorizontal:18,paddingVertical:13,alignItems:'center',justifyContent:'center'}}>
   <Text style={{fontFamily:font.heading,fontSize:14,color:primary?palette.ink:palette.moon,textAlign:'center'}}>{label}</Text>
  </RitualSurface>
 </Pressable>;
}
export function QuietHeader({title,subtitle,onClose,closeLabel='ปิด'}:{title:string;subtitle?:string;onClose?:()=>void;closeLabel?:string}){
 return <View style={{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:20,paddingVertical:12}}>
  <View style={{flex:1}}><Text accessibilityRole="header" style={{fontFamily:font.display,fontSize:28,color:palette.moon}}>{title}</Text>
   {subtitle&&<Text style={{fontFamily:font.ui,fontSize:12,lineHeight:20,color:palette.textDim,marginTop:3}}>{subtitle}</Text>}</View>
  {onClose&&<QuietButton label={closeLabel} onPress={onClose}/>}
 </View>;
}
export function QuietPage({title,subtitle,onClose,closeLabel,source,children,footer}:{title:string;subtitle?:string;onClose?:()=>void;closeLabel?:string;source?:ImageSourcePropType;children:React.ReactNode;footer?:React.ReactNode}){
 const pad=useScreenPadding();
 return <ImageBackground source={source??require('../../assets/scence/quiet-village.png')} style={{flex:1}}>
  <View style={{flex:1,paddingTop:pad.top,backgroundColor:quietUiColors.hudShade}}>
   <QuietHeader title={title} subtitle={subtitle} onClose={onClose} closeLabel={closeLabel}/>
   <ScrollView style={{flex:1}} contentContainerStyle={{paddingHorizontal:20,paddingTop:12,paddingBottom:footer?20:pad.bottom+24,gap:16,width:'100%',maxWidth:600,alignSelf:'center'}}>{children}</ScrollView>
   {footer&&<View style={{paddingHorizontal:20,paddingTop:8,paddingBottom:pad.bottom+12}}>{footer}</View>}
  </View>
 </ImageBackground>;
}
export function QuietSection({title,children}:{title?:string;children:React.ReactNode}){
 return <RitualSurface kind="quietSlate" style={{padding:22,gap:10}}>{title&&<Text style={{fontFamily:font.heading,fontSize:19,color:palette.moon}}>{title}</Text>}{children}</RitualSurface>;
}
