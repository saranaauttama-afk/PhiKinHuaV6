import React from 'react';
import {Image,Modal,Pressable,ScrollView,Text,View} from 'react-native';
import type {BlessingDef} from '../../../src/core/types';
import {groupBlessings} from '../../../src/core/blessing/group';
import {objectSource} from '../BlessingView';
import {describeBlessing} from '../../../src/core/cards/describe';
import RitualSurface from '../RitualSurface';
import {QuietButton} from '../QuietChrome';
import {font,palette,blessingSealColors} from '../../theme';
export default function BlessingSeals({blessings}:{blessings?:BlessingDef[]}) {
 const [open,setOpen]=React.useState<string|null>(null);const [all,setAll]=React.useState(false);const [width,setWidth]=React.useState(0);
 const rows=groupBlessings(blessings??[]);const selected=rows.find(r=>r.blessing.id===open);
 if(!rows.length)return null;
 // Fit what the row can hold; the rest sit behind a "+N" seal that lists every blessing.
 const cap=Math.max(1,Math.floor((width||9999)/39)),overflow=rows.length>cap,shown=overflow?rows.slice(rows.length-(cap-1)):rows;
 const seal=(b:BlessingDef,count:number)=><Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`ดูพร ${b.name}`} onPress={()=>{setAll(false);setOpen(b.id);}} style={{width:36,height:36,alignItems:'center',justifyContent:'center'}}>
    <View style={{width:30,height:30,borderRadius:17,backgroundColor:blessingSealColors.backing,borderColor:blessingSealColors.line,borderWidth:1,overflow:'hidden',alignItems:'center',justifyContent:'center'}}><Image source={objectSource(b)} resizeMode="contain" style={{width:26,height:26}}/></View>
    {count>1&&<Text style={{position:'absolute',right:1,bottom:0,color:palette.moon,fontFamily:font.ui,fontSize:10}}>×{count}</Text>}
   </Pressable>;
 return <View testID="player-blessing-seals" onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={{height:36,width:'100%',flexDirection:'row',justifyContent:'flex-end',gap:3,overflow:'hidden'}}>
  {overflow&&<Pressable testID="blessing-seals-more" accessibilityRole="button" accessibilityLabel={`ดูพรทั้งหมด ${rows.length} อย่าง`} onPress={()=>setAll(true)} style={{width:36,height:36,alignItems:'center',justifyContent:'center'}}>
   <View style={{width:30,height:30,borderRadius:17,backgroundColor:blessingSealColors.backing,borderColor:blessingSealColors.line,borderWidth:1,alignItems:'center',justifyContent:'center'}}><Text style={{color:palette.moon,fontFamily:font.heading,fontSize:12}}>+{rows.length-shown.length}</Text></View>
  </Pressable>}
  {shown.map(({blessing:b,count})=>seal(b,count))}
  <Modal visible={all} transparent animationType="fade" onRequestClose={()=>setAll(false)}>
   <View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:palette.scrimHeavy}}>
    <Pressable accessibilityLabel="ปิดรายการพร" onPress={()=>setAll(false)} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
    <RitualSurface kind="occupationPage" style={{padding:24,gap:10,maxHeight:'80%'}}>
     <Text style={{fontFamily:font.heading,color:blessingSealColors.paperInk,fontSize:20}}>พรติดตัว {rows.length} อย่าง</Text>
     <ScrollView contentContainerStyle={{gap:10}}>{rows.map(({blessing:b,count})=><Pressable key={b.id} accessibilityRole="button" accessibilityLabel={b.name} onPress={()=>{setAll(false);setOpen(b.id);}} style={{flexDirection:'row',gap:10,alignItems:'center'}}>
      <Image source={objectSource(b)} resizeMode="contain" style={{width:36,height:36}}/>
      <View style={{flex:1}}><Text style={{fontFamily:font.heading,color:blessingSealColors.paperInk,fontSize:15}}>{b.name}{count>1?` ×${count}`:''}</Text><Text style={{fontFamily:font.ui,color:blessingSealColors.paperInk,fontSize:13,lineHeight:20}}>{describeBlessing(b)}</Text></View>
     </Pressable>)}</ScrollView>
     <QuietButton label="ปิด" onPress={()=>setAll(false)}/>
    </RitualSurface>
   </View>
  </Modal>
  <Modal visible={!!selected} transparent animationType="fade" onRequestClose={()=>setOpen(null)}>
   <View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:palette.scrimHeavy}}>
    <Pressable accessibilityLabel="ปิดรายละเอียดพร" onPress={()=>setOpen(null)} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
    {selected&&<RitualSurface kind="occupationPage" style={{padding:28,gap:12,maxHeight:'80%'}}>
     <ScrollView><Image source={objectSource(selected.blessing)} resizeMode="contain" style={{width:80,height:80,alignSelf:'center'}}/>
      <Text style={{fontFamily:font.heading,color:blessingSealColors.paperInk,fontSize:20}}>{selected.blessing.name}</Text>
      <Text style={{fontFamily:font.ui,color:blessingSealColors.paperInk,fontSize:15,lineHeight:26}}>{describeBlessing(selected.blessing)}</Text>
      <Text style={{fontFamily:font.ui,color:blessingSealColors.paperInk,fontSize:12}}>พรติดตัว · แยกจากสถานะชั่วคราว</Text>
     </ScrollView><QuietButton label="ปิด" onPress={()=>setOpen(null)}/>
    </RitualSurface>}
   </View>
  </Modal>
 </View>;
}
