import React from 'react';
import {View,Text,ImageBackground,Image,Pressable,ScrollView,useWindowDimensions} from 'react-native';
import type {BlessingDef,GameState} from '../../src/core/types';
import RitualSurface from './RitualSurface';
import {GameButton} from './Panel';
import {objectSource} from './BlessingView';
import PlayerStatusBar,{STATUS_BAR_SPACE} from './PlayerStatusBar';
import {font,palette,quietUiColors} from '../theme';
import {useScreenPadding} from '../useScreenPadding';
export default function StarterBlessingScreen({choices,onPick,state}:{choices:BlessingDef[];onPick:(index:number)=>void;state?:GameState}){
 const [selected,setSelected]=React.useState<number|null>(null);const pad=useScreenPadding();const {width}=useWindowDimensions();
 const chosen=selected!==null?choices[selected]:undefined;
 return <ImageBackground source={require('../../assets/scence/quiet-village.png')} resizeMode="cover" style={{flex:1}}>
  <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center',paddingHorizontal:16,paddingTop:pad.top+32,paddingBottom:pad.bottom+(state?STATUS_BAR_SPACE:24)}}>
   <Image source={require('../../assets/ui/blessing-shrine-object.png')} resizeMode="contain" style={{height:130,width:'100%',marginBottom:12}}/>
   <RitualSurface kind="quietSlate" style={{padding:18,gap:18}}>
    <Text accessibilityRole="header" style={{fontFamily:font.heading,fontSize:24,color:palette.moon,textAlign:'center'}}>เลือกพรติดตัว</Text>
    <View style={{flexDirection:'row',gap:8}}>{choices.map((b,i)=><Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`พรติดตัว ${i+1}: ${b.name}`} accessibilityState={{selected:i===selected}} onPress={()=>setSelected(i)} style={{flex:1,borderWidth:1,borderColor:i===selected?palette.moon:quietUiColors.optionLine,paddingHorizontal:4,paddingVertical:10}}>
     <Image accessible={false} source={objectSource(b)} resizeMode="contain" style={{width:'100%',height:Math.min(105,(width-64)/choices.length)}}/>
     <Text style={{fontFamily:font.heading,fontSize:13,lineHeight:20,color:palette.moon,textAlign:'center'}}>{b.name}</Text>
    </Pressable>)}</View>
    <Text style={{fontFamily:font.ui,color:palette.moon,fontSize:14,lineHeight:23,minHeight:69,textAlign:'center'}}>{chosen?.desc??'แตะพรเพื่ออ่านรายละเอียด'}</Text>
    <GameButton label="ยืนยันพร" disabled={selected===null} onPress={()=>selected!==null&&onPick(selected)}/>
   </RitualSurface>
  </ScrollView>
  {state&&<PlayerStatusBar state={state}/>}
 </ImageBackground>;
}
