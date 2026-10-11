import React from 'react';
import {Image,Modal,Pressable,ScrollView,Text,View} from 'react-native';
import type {BlessingDef} from '../../../src/core/types';
import {groupBlessings} from '../../../src/core/blessing/group';
import {objectSource} from '../BlessingView';
import RitualSurface from '../RitualSurface';
import {QuietButton} from '../QuietChrome';
import {font,palette,blessingSealColors} from '../../theme';
export default function BlessingSeals({blessings}:{blessings?:BlessingDef[]}) {
 const scroll=React.useRef<ScrollView>(null);
 const [open,setOpen]=React.useState<string|null>(null);const rows=groupBlessings(blessings??[]);const selected=rows.find(r=>r.blessing.id===open);
 if(!rows.length)return null;
 return <View testID="player-blessing-seals" style={{height:36,width:'100%'}}>
  <ScrollView ref={scroll} onContentSizeChange={()=>scroll.current?.scrollToEnd({animated:false})} horizontal showsHorizontalScrollIndicator={rows.length>6} contentContainerStyle={{flexDirection:'row-reverse',flexGrow:1,justifyContent:'flex-start',gap:3}}>
   {rows.map(({blessing:b,count})=><Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`ดูพร ${b.name}`} onPress={()=>setOpen(b.id)} style={{width:36,height:36,alignItems:'center',justifyContent:'center'}}>
    <View style={{width:30,height:30,borderRadius:17,backgroundColor:blessingSealColors.backing,borderColor:blessingSealColors.line,borderWidth:1,overflow:'hidden',alignItems:'center',justifyContent:'center'}}><Image source={objectSource(b)} resizeMode="contain" style={{width:26,height:26}}/></View>
    {count>1&&<Text style={{position:'absolute',right:1,bottom:0,color:palette.moon,fontFamily:font.ui,fontSize:10}}>×{count}</Text>}
   </Pressable>)}
  </ScrollView>
  <Modal visible={!!selected} transparent animationType="fade" onRequestClose={()=>setOpen(null)}>
   <View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:palette.scrimHeavy}}>
    <Pressable accessibilityLabel="ปิดรายละเอียดพร" onPress={()=>setOpen(null)} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
    {selected&&<RitualSurface kind="occupationPage" style={{padding:28,gap:12,maxHeight:'80%'}}>
     <ScrollView><Image source={objectSource(selected.blessing)} resizeMode="contain" style={{width:80,height:80,alignSelf:'center'}}/>
      <Text style={{fontFamily:font.heading,color:blessingSealColors.paperInk,fontSize:20}}>{selected.blessing.name}</Text>
      <Text style={{fontFamily:font.ui,color:blessingSealColors.paperInk,fontSize:15,lineHeight:26}}>{selected.blessing.desc}</Text>
      <Text style={{fontFamily:font.ui,color:blessingSealColors.paperInk,fontSize:12}}>พรติดตัว · แยกจากสถานะชั่วคราว</Text>
     </ScrollView><QuietButton label="ปิด" onPress={()=>setOpen(null)}/>
    </RitualSurface>}
   </View>
  </Modal>
 </View>;
}
