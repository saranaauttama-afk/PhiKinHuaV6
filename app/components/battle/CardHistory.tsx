import React from 'react';
import {Image,Modal,Pressable,ScrollView,Text,View} from 'react-native';
import type {CardHistoryEntry} from '../../../src/core/types';
import {CardGlyphArt} from '../DeckCard';
import {artSource} from '../Art';
import RitualSurface from '../RitualSurface';
import DetailPanel,{detailCopy} from '../DetailPanel';
import CardBadges from '../CardBadges';
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
    </View>
   </Pressable>)}
  </View>
  <Modal visible={!!selected} transparent animationType="fade" onRequestClose={()=>setSelected(null)}>
   <View style={{flex:1,backgroundColor:palette.scrimHeavy,padding:24,paddingTop:safe.top+24,paddingBottom:safe.bottom+24,justifyContent:'center'}}>
    <Pressable accessibilityLabel="ปิดประวัติการ์ด" onPress={()=>setSelected(null)} style={{position:'absolute',inset:0}}/>
    {selected&&<DetailPanel title={selected.card.name} art={<CardGlyphArt card={selected.card} size={68}/>} badges={<CardBadges card={selected.card} ink={palette.moon}/>} description={describeCard(selected.card,selected.side)}
     actions={<QuietButton label="ปิดประวัติ" onPress={()=>setSelected(null)}/>}>
     <Text style={detailCopy}>เทิร์น {selected.turn}</Text><Text style={{...detailCopy,fontFamily:font.heading}}>ผลที่เกิดขึ้น</Text>
     {selected.results.map((line,i)=><Text key={i} style={detailCopy}>{line}</Text>)}
    </DetailPanel>}
   </View>
  </Modal>
 </>;
}
