import React from 'react';
import {Linking,Modal,Pressable,ScrollView,Text,View} from 'react-native';
import {ghostLore} from '../../src/core/monsters/folklore';
import {font,palette} from '../theme';
import RitualSurface from './RitualSurface';
import InkIcon from './InkIcon';
import {QuietButton} from './QuietChrome';

export default function GhostLoreButton({id,compact=false}:{id:string;compact?:boolean}) {
 const [open,setOpen]=React.useState(false);
 const [sourceError,setSourceError]=React.useState(false);
 const lore=ghostLore(id);
 if(!lore)return null;
 const copy={fontFamily:font.ui,fontSize:14,lineHeight:24,color:palette.text};
 return <>
  <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel={`อ่านที่มาของ ${lore.name}`} onPress={e=>{e.stopPropagation();setOpen(true);}} style={{paddingHorizontal:compact?2:10,paddingVertical:compact?2:6,minWidth:compact?24:undefined,minHeight:compact?24:undefined}}>
   {compact?<Text style={{fontFamily:font.ui,fontSize:10,color:palette.text}}>ที่มา</Text>:<Text style={{fontFamily:font.ui,fontSize:12,color:palette.moon,textDecorationLine:'underline'}}>ที่มาของผี</Text>}
  </Pressable>
  <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
   <View style={{flex:1,backgroundColor:palette.scrimHeavy,justifyContent:'center',padding:24}}>
    <RitualSurface kind="quietSlate" accessibilityViewIsModal style={{maxHeight:'85%',padding:18}}>
     <ScrollView contentContainerStyle={{gap:12}}>
      <Text accessibilityRole="header" style={{fontFamily:font.heading,fontSize:24,color:palette.moon}}>{lore.name}</Text>
      <Text style={copy}>{lore.species} · {lore.region}</Text>
      <Text style={{...copy,color:palette.moon}}>ที่มาของความเชื่อ</Text>
      <Text style={copy}>{lore.origin}</Text>
      <Text style={{...copy,color:palette.moon}}>เรื่องราวในเกม</Text>
      <Text style={copy}>{lore.story}</Text>
      {!lore.original&&<Text style={{...copy,fontSize:12}}>ประวัติบุคคล สถานที่ และวิชาต่อสู้เป็นเรื่องแต่งสำหรับเกม</Text>}
      {!!lore.source&&<QuietButton label="อ่านแหล่งอ้างอิง" onPress={()=>{void Linking.openURL(lore.source).catch(()=>setSourceError(true));}}/>}
      {sourceError&&<Text selectable style={copy}>เปิดแหล่งอ้างอิงไม่ได้ · คัดลอกลิงก์นี้ไปเปิดในเบราว์เซอร์{'\n'}{lore.source}</Text>}
      <QuietButton label="กลับ" onPress={()=>setOpen(false)}/>
     </ScrollView>
    </RitualSurface>
   </View>
  </Modal>
 </>;
}
