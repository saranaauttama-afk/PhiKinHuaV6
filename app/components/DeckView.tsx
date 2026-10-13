// Complete deck on a woven mat. Grouped cards open full live details; equipment actions stay available.
import { paper } from '../theme';
import React from 'react';
import { Image, ImageBackground, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { CardData, Command, GameState } from '../../src/core/types';
import { groupCards } from '../../src/core/cards/group';
import EquipmentPicker from './EquipmentPicker';
import {loadoutIndices} from '../../src/core/cards/equipment';
import {describeBlessing} from '../../src/core/cards/describe';
import {objectSource} from './BlessingView';
import {groupBlessings} from '../../src/core/blessing/group';
import CardRow from './CardRow';
import DeckCard, { CardGlyphArt } from './DeckCard';
import RitualSurface from './RitualSurface';
import {QuietHeader,QuietButton} from './QuietChrome';
import { font, radius, size, space, layer, palette, surface } from '../theme';
import { useScreenPadding } from '../useScreenPadding';

import {CARD_TYPE_LABELS as TYPE_LABEL,CARD_TYPE_ORDER as TYPE_ORDER} from '../../src/core/cards/typesRegistry';

type Props = {
  initialTab?: 'deck'|'blessings';
  state: GameState;
  dispatch: (cmd: Command) => void;
};

export default function DeckView({ state, dispatch, initialTab='deck' }: Props) {
  const pad = useScreenPadding();
  const [tab,setTab]=React.useState(initialTab);
  const [manage,setManage]=React.useState(false);
  React.useEffect(()=>{if(state.deckOpen)setTab(initialTab);else setManage(false)},[state.deckOpen,initialTab]);
  const [selected, setSelected] = React.useState<{ card: CardData; count: number } | null>(null);
  React.useEffect(() => { if (!state.deckOpen) setSelected(null); }, [state.deckOpen]);
  if (!state.deckOpen) return null;

  const deck = state.masterDeck ?? [];

  const rows = groupCards(deck);


  return (
    <ImageBackground source={require('../../assets/ui/deck-mat.jpg')} resizeMode="cover" style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: palette.scrimFull,
      zIndex: layer.overlay,
    }}>

      <View style={{paddingTop:pad.top}}><QuietHeader title="สำรับของเรา" subtitle={`ทั้งหมด ${deck.length} ใบ · แตะการ์ดเพื่ออ่านรายละเอียด`} onClose={()=>dispatch({type:'CloseDeck'})}/></View>

      <View style={{flexDirection:'row',gap:8,paddingHorizontal:16,paddingBottom:8}}>
       {(['deck','blessings'] as const).map(t=><Pressable key={t} testID={`bag-tab-${t}`} accessibilityRole="tab" accessibilityState={{selected:tab===t}} onPress={()=>setTab(t)} style={{flex:1,minHeight:44,alignItems:'center',justifyContent:'center',backgroundColor:tab===t?palette.paperDeep:palette.scrim,borderBottomWidth:2,borderColor:tab===t?palette.moon:palette.line}}><Text style={{fontFamily:font.heading,color:palette.moon,fontSize:14}}>{t==='deck'?`สำรับ (${deck.length})`:`พร (${state.blessings?.length??0})`}</Text></Pressable>)}
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.xl, paddingBottom: pad.bottom + space.xxl, gap: space.lg,
        }}
      >
        {tab==='blessings'?<View testID="bag-blessings" style={{gap:10}}>
         {!state.blessings?.length&&<Text style={{color:palette.moon,fontFamily:font.ui}}>ยังไม่มีพรติดตัว</Text>}
         {groupBlessings(state.blessings??[]).map(({blessing:b,count})=><RitualSurface key={b.id} kind="quietSlate" style={{padding:12,flexDirection:'row',gap:10}}>
          <Image source={objectSource(b)} resizeMode="contain" style={{width:48,height:48}}/>
          <View style={{flex:1}}><Text style={{color:palette.moon,fontFamily:font.heading,fontSize:15}}>{b.name}{count>1?` ×${count}`:''}{b.pandora?' · แพนโดรา':''}</Text><Text style={{color:palette.text,fontFamily:font.ui,fontSize:13,lineHeight:22}}>{describeBlessing(b)}</Text></View>
         </RitualSurface>)}
        </View>:<>
        <RitualSurface kind="quietSlate" style={{padding:12,gap:8}}>
         <Text style={{color:palette.moon,fontFamily:font.heading,fontSize:15}}>ช่องสวมอุปกรณ์ · {state.equipmentSlotsMax??1} ช่อง</Text>
         <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
          {Array.from({length:state.equipmentSlotsMax??1},(_,i)=>{
           const inFight=['combat','victory','reward','levelup','defeat'].includes(state.phase);
           const card=inFight?state.equipped?.[i]:deck[loadoutIndices(state)[i]];
           return <Pressable key={i} testID={`bag-equipment-slot-${i}`} accessibilityRole="button" accessibilityLabel={card?`ช่อง ${i+1} ${card.name}`:`ช่องอุปกรณ์ว่าง ${i+1}`} onPress={()=>{if(inFight){if(card)setSelected({card,count:1})}else setManage(true)}} style={{width:78,minHeight:90,padding:6,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:palette.moonDim}}>
            {card?<><CardGlyphArt card={card} size={40}/><Text style={{color:palette.moon,fontFamily:font.ui,fontSize:10,textAlign:'center'}}>✓ {card.name}</Text></>:<><Text style={{color:palette.moon,fontSize:28}}>+</Text><Text style={{color:palette.text,fontFamily:font.ui,fontSize:10}}>ช่องว่าง</Text></>}
           </Pressable>;
          })}
         </View>
         {!deck.some(c=>c.type==='equipment')&&<Text style={{color:palette.text,fontFamily:font.ui,fontSize:12}}>ยังไม่มีอุปกรณ์ในสำรับ · หาได้จากร้านและรางวัล</Text>}
         <Text style={{color:palette.text,fontFamily:font.ui,fontSize:11}}>สวมก่อนสู้ · ไพ่ที่สวมจะออกจากกองจั่ว</Text>
        </RitualSurface>
        {deck.length === 0 && (
          <Text style={{
            color: palette.textDim, fontSize: size.bodyLg, fontFamily: font.body,
            textAlign: 'center', paddingVertical: space.xxl,
          }}>
            สำรับว่างเปล่า
          </Text>
        )}


        <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>
         {TYPE_ORDER.map(type=>{const total=deck.filter(c=>c.type===type).length;return total?<Text key={type} style={{color:palette.moon,fontFamily:font.ui,fontSize:11}}>{TYPE_LABEL[type]} ({total} ใบ)</Text>:null})}
        </View>
        <View testID="bag-card-grid" style={{flexDirection:'row',flexWrap:'wrap',gap:7,rowGap:12}}>
         {rows.map((r,i)=><DeckCard compact key={`${r.card.id}-${i}`} card={r.card} equippedCount={(state.phase==='combat'?(state.equipped??[]):loadoutIndices(state).map(i=>deck[i])).filter(c=>c.id===r.card.id&&(c.star??1)===(r.card.star??1)).length} count={r.count} onPress={()=>setSelected(r)}/>)}
        </View>
        </>}
      </ScrollView>
      {manage&&<EquipmentPicker manage state={state} onCancel={()=>setManage(false)} onConfirm={indices=>{dispatch({type:'SetEquipmentLoadout',indices});setManage(false);}}/>}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: palette.scrimHeavy, paddingHorizontal: 20, paddingTop: pad.top + 16, paddingBottom: pad.bottom + 16, justifyContent: 'center' }}>
          {selected && <RitualSurface kind="occupationPage" style={{ maxHeight: '95%', padding: 24 }}>
            <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
              <Text accessibilityRole="header" style={{ color: paper.ink, fontFamily: font.heading, fontSize: 18, textAlign: 'center' }}>รายละเอียดการ์ด</Text>
              <View style={{ alignItems: 'center', marginTop: 10 }}><CardGlyphArt card={selected.card} size={110} /></View>
              <CardRow card={selected.card} count={selected.count} plain />
            </ScrollView>
            <Pressable accessibilityRole="button" accessibilityLabel="กลับไปดูสำรับ" onPress={() => setSelected(null)} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: paper.ink, fontFamily: font.heading, fontSize: 14 }}>กลับไปดูสำรับ</Text>
            </Pressable>
          </RitualSurface>}
        </View>
      </Modal>
    </ImageBackground>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={{ color: title.startsWith('การ์ดโจมตี') ? palette.bloodLit : palette.text, fontSize: size.heading, fontFamily: font.heading }}>
        {title}
      </Text>
      <View style={{ gap: space.sm }}>{children}</View>
    </View>
  );
}

