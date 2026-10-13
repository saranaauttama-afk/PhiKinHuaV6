import React from 'react';
import {Image,Modal,Pressable,ScrollView,Text,View} from 'react-native';
import type {CardHistoryEntry} from '../../../src/core/types';
import {CardGlyphArt} from '../DeckCard';
import {artSource} from '../Art';
import RitualSurface from '../RitualSurface';
import {QuietButton} from '../QuietChrome';
import {font,palette,layer} from '../../theme';
import {paper} from '../Paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {describeCard} from '../../../src/core/cards/describe';

export default function CardHistory({entries}:{entries:CardHistoryEntry[]}){
 const safe=useSafeAreaInsets();const [selected,setSelected]=React.useState<CardHistoryEntry|null>(null);
 return <>
  <View testID="card-history" accessibilityLabel="ประวัติการ์ด 6 ใบล่าสุด" style={{position:'absolute',top:safe.top+2,left:10,right:58,height:40,flexDirection:'row',gap:3,zIndex:layer.control}}>
   {entries.map(e=><Pressable key={e.seq} testID={`history-${e.seq}`} accessibilityRole="button" accessibilityLabel={`ประวัติ ${e.side==='player'?'เรา':'ผี'}ใช้ ${e.card.name} เทิร์น ${e.turn}`} onPress={()=>setSelected(e)} style={({pressed})=>({width:40,height:40,alignItems:'center',justifyContent:'center',opacity:pressed?.7:1})}>
    <View style={{width:32,height:32,borderRadius:16,borderWidth:2,borderColor:e.side==='player'?palette.moon:palette.bloodLit,backgroundColor:palette.ink,overflow:'hidden',alignItems:'center',justifyContent:'center'}}>
     {e.side==='enemy'&&e.ownerId?<Image source={artSource(`monster/${e.ownerId}`)} resizeMode="contain" style={{width:28,height:28}}/>:<CardGlyphArt card={e.card} size={28}/>}
    </View><Text style={{position:'absolute',bottom:0,fontSize:9,lineHeight:11,fontFamily:font.ui,color:palette.moon,backgroundColor:palette.ink}}>{e.side==='player'?'เรา':'ผี'}</Text>
   </Pressable>)}
  </View>
  <Modal visible={!!selected} transparent animationType="fade" onRequestClose={()=>setSelected(null)}>
   <View style={{flex:1,backgroundColor:palette.scrimHeavy,padding:24,paddingTop:safe.top+24,paddingBottom:safe.bottom+24,justifyContent:'center'}}>
    <Pressable accessibilityLabel="ปิดประวัติการ์ด" onPress={()=>setSelected(null)} style={{position:'absolute',inset:0}}/>
    {selected&&<RitualSurface kind="occupationPage" accessibilityViewIsModal style={{padding:22,gap:12,maxHeight:'90%'}}>
     <Text style={{fontFamily:font.ui,color:paper.muted,fontSize:13}}>{selected.side==='player'?'เรา':'ผี'}ใช้ · เทิร์น {selected.turn}</Text>
     <Text accessibilityRole="header" style={{fontFamily:font.heading,color:paper.ink,fontSize:23}}>{selected.card.name}</Text>
     <ScrollView><Text style={{fontFamily:font.body,color:paper.ink,fontSize:18,lineHeight:27}}>{describeCard(selected.card)}</Text><Text style={{fontFamily:font.heading,color:paper.ink,fontSize:17,marginTop:12}}>ผลที่เกิดขึ้น</Text>{selected.results.map((line,i)=><Text key={i} style={{fontFamily:font.ui,color:paper.ink,fontSize:15,lineHeight:25}}>{line}</Text>)}</ScrollView>
     <QuietButton label="ปิดประวัติ" primary onPress={()=>setSelected(null)}/>
    </RitualSurface>}
   </View>
  </Modal>
 </>;
}
