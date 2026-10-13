import React from 'react';
import {ScrollView,Text,View,StyleProp,ViewStyle} from 'react-native';
import RitualSurface from './RitualSurface';
import {font,palette} from '../theme';
export const detailCopy={fontFamily:font.ui,fontSize:14,lineHeight:24,color:palette.text};
/** Both sides share the player's dark illustrated detail panel and Prompt font. */
export default function DetailPanel({title,art,badges,description,children,actions,style,testID}:{title:string;art?:React.ReactNode;badges?:React.ReactNode;description?:string;children?:React.ReactNode;actions?:React.ReactNode;style?:StyleProp<ViewStyle>;testID?:string}) {
 return <RitualSurface testID={testID} kind="quietSlate" accessibilityViewIsModal style={[{padding:20,gap:12,maxHeight:'85%'},style]}>
  <ScrollView contentContainerStyle={{gap:12}}>
   <View style={{flexDirection:'row',gap:12,alignItems:'flex-start'}}>
    {art}<View style={{flex:1,minWidth:0,gap:6}}>
     <Text accessibilityRole="header" style={{fontFamily:font.heading,fontSize:18,lineHeight:28,color:palette.moon}}>{title}</Text>
     {badges}{description!=null&&<Text style={detailCopy}>{description}</Text>}
    </View>
   </View>{children}
  </ScrollView>{actions}
 </RitualSurface>;
}
