import React from 'react';
import {View,Text,useWindowDimensions} from 'react-native';
import type {CardData} from '../../../src/core/types';
import Card from '../Card';
import CardRow from '../CardRow';
import RitualSurface from '../RitualSurface';
import {GameButton} from '../Panel';
import PostBattleSurface from './PostBattleSurface';
import {font,palette,paper} from '../../theme';
type Props={notice?:string;choices:CardData[];deck:CardData[];onChoose:(index:number)=>void;onSkip:()=>void};
export default function CardRewardOverlay({choices,deck,onChoose,onSkip,notice}:Props){
 const [selected,setSelected]=React.useState<number|null>(null);const {width}=useWindowDimensions();
 const cardWidth=Math.min(132,(width-56)/3);const card=selected===null?null:choices[selected];
 const owned=(id:string)=>deck.filter(c=>c.id===id).length;
 return <PostBattleSurface mat>
  {!!notice&&<RitualSurface kind="darkCloth" style={{padding:18,marginBottom:14}}><Text accessibilityLiveRegion="polite" style={{fontFamily:font.ui,color:palette.moon,fontSize:14,lineHeight:24,textAlign:'center'}}>{notice}</Text></RitualSurface>}
  <RitualSurface kind="wood" style={{padding:24,alignItems:'center',marginBottom:22}}>
   <Text style={{fontFamily:font.heading,fontSize:24,color:palette.moon}}>ของที่เก็บได้</Text>
   <Text style={{fontFamily:font.ui,fontSize:12,color:palette.text,textAlign:'center'}}>สำรับตอนนี้ {deck.length} ใบ · หยิบแล้วจะเป็น {deck.length+1} ใบ</Text>
   <Text style={{fontFamily:font.ui,fontSize:12,color:palette.text,marginTop:8}}>แตะการ์ดเพื่ออ่านก่อนเลือก</Text>
  </RitualSurface>
  <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:8,paddingTop:12}}>
   {choices.map((c,i)=><View key={c.instanceId??`${c.id}-${i}`} style={{width:cardWidth,transform:[{translateY:selected===i?-8:0}]}}>
    <Card card={c} width={cardWidth} height={174} selected={selected===i} onPress={()=>setSelected(selected===i?null:i)}/>
    <Text style={{fontFamily:font.ui,fontSize:11,textAlign:'center',color:palette.text,backgroundColor:palette.scrim,marginTop:4,padding:4}}>มีอยู่แล้ว {owned(c.id)} ใบ</Text>
   </View>)}
  </View>
  {card&&<RitualSurface kind="occupationPage" style={{padding:20,marginTop:18}}>
   <CardRow card={card} plain/>
   <GameButton label={`รับ ${card.name}`} tone="primary" onPress={()=>selected!==null&&onChoose(selected)}/>
  </RitualSurface>}
  <GameButton label="ไม่เอาสักใบ" onPress={onSkip} style={{marginTop:22}}/>
  <Text style={{color:palette.text,fontFamily:font.ui,fontSize:11,textAlign:'center',marginTop:10}}>สำรับเล็กคือสำรับที่จั่วเจอใบที่ต้องการบ่อยกว่า</Text>
 </PostBattleSurface>;
}
