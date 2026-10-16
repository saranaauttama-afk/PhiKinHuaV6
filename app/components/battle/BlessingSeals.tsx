import React from 'react';
import {Image,Modal,Pressable,ScrollView,Text,View} from 'react-native';
import type {BlessingDef} from '../../../src/core/types';
import {groupBlessings} from '../../../src/core/blessing/group';
import {objectSource} from '../BlessingView';
import {describeBlessing} from '../../../src/core/cards/describe';
import RitualSurface from '../RitualSurface';
import {QuietButton} from '../QuietChrome';
import {font,palette,blessingSealColors} from '../../theme';
import BattleSeal,{BATTLE_SEAL_ART_SIZE} from './BattleSeal';
export default function BlessingSeals({blessings}:{blessings?:BlessingDef[]}) {
 const [open,setOpen]=React.useState<string|null>(null);const [all,setAll]=React.useState(false);
 const rows=groupBlessings(blessings??[]);const selected=rows.find(r=>r.blessing.id===open);
 return <View testID="player-blessing-seals" style={{height:36,width:'100%',alignItems:'flex-end',justifyContent:'center'}}>
  <BattleSeal hitSize={36} testID="blessing-seals-more" label={`ดูพรทั้งหมด ${blessings?.length??0} พร`} onPress={()=>setAll(true)} count={blessings?.length??0}>
   <Image accessible={false} source={require('../../../assets/ui/blessing-amulet.png')} resizeMode="contain" style={{width:BATTLE_SEAL_ART_SIZE,height:BATTLE_SEAL_ART_SIZE}}/>
  </BattleSeal>
  <Modal visible={all} transparent animationType="fade" onRequestClose={()=>setAll(false)}>
   <View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:palette.scrimHeavy}}>
    <Pressable accessibilityLabel="ปิดรายการพร" onPress={()=>setAll(false)} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}/>
    <RitualSurface kind="occupationPage" style={{padding:24,gap:10,maxHeight:'80%'}}>
     <Text style={{fontFamily:font.heading,color:blessingSealColors.paperInk,fontSize:20}}>พรติดตัว {rows.length} อย่าง</Text>
     <ScrollView contentContainerStyle={{gap:10}}>{!rows.length&&<Text style={{fontFamily:font.ui,color:blessingSealColors.paperInk}}>ยังไม่มีพรติดตัว</Text>}{rows.map(({blessing:b,count})=><Pressable key={b.id} accessibilityRole="button" accessibilityLabel={b.name} onPress={()=>{setAll(false);setOpen(b.id);}} style={{flexDirection:'row',gap:10,alignItems:'center'}}>
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
