import React from 'react';
import {Image,Text,View} from 'react-native';
import type {GameState} from '../../src/core/types';
import {CardGlyphArt} from './DeckCard';
import CardBadges from './CardBadges';
import {objectSource} from './BlessingView';
import {cardSummary} from '../cardPresentation';
import {font,palette} from '../theme';
export default function RewardReceiptView({receipt}:{receipt?:GameState['rewardReceipt']}){
 if(!receipt)return null;
 return <View testID="reward-receipt" style={{gap:12}}>
  {receipt.cards.map((c,i)=><View key={`card-${i}`} style={{flexDirection:'row',gap:10,alignItems:'center'}}><CardGlyphArt card={c} size={56}/><View style={{flex:1,gap:3}}><Text style={{fontFamily:font.heading,color:palette.moon,fontSize:16}}>ได้รับ {c.name}</Text><CardBadges card={c} compact ink={palette.moon}/><Text style={{fontFamily:font.ui,color:palette.text,fontSize:13,lineHeight:21}}>{cardSummary(c)}{c.desc?`\n${c.desc}`:''}</Text></View></View>)}
  {receipt.blessings.map((b,i)=><View key={`blessing-${i}`} style={{flexDirection:'row',gap:10,alignItems:'center'}}><Image source={objectSource(b)} resizeMode="contain" style={{width:56,height:56}}/><View style={{flex:1}}><Text style={{fontFamily:font.heading,color:palette.moon,fontSize:16}}>ได้รับพร {b.name}</Text><Text style={{fontFamily:font.ui,color:palette.text,fontSize:13,lineHeight:21}}>{b.desc}</Text></View></View>)}
  {receipt.equipment.map((e,i)=><View key={`equipment-${i}`}><Text style={{fontFamily:font.heading,color:palette.moon,fontSize:16}}>ได้รับ {e.name}</Text><Text style={{fontFamily:font.ui,color:palette.text,fontSize:13,lineHeight:21}}>{e.desc}</Text></View>)}
  {!!receipt.lostCards.length&&<Text style={{fontFamily:font.ui,color:palette.text}}>สละการ์ด: {receipt.lostCards.map(c=>c.name).join(' · ')}</Text>}
  {(!!receipt.hp||!!receipt.gold)&&<Text style={{fontFamily:font.ui,color:palette.text}}>{[receipt.hp?`ชีวิต ${receipt.hp>0?'+':''}${receipt.hp}`:'',receipt.gold?`เบี้ย ${receipt.gold>0?'+':''}${receipt.gold}`:''].filter(Boolean).join(' · ')}</Text>}
 </View>;
}
