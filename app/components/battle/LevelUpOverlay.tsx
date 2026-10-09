import {palette,surface} from '../../theme';
import PostBattleSurface from './PostBattleSurface';
import RitualSurface from '../RitualSurface';
import {QuietButton} from '../QuietChrome';
import {Image} from 'react-native';
import {objectSource} from '../BlessingView';
import {RITUAL_OBJECTS} from '../RitualObject';
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { CardData, GameState } from '../../../src/core/types';
import CardRow from '../CardRow';
import CandleSelection from '../CandleSelection';
import UpgradeCardPicker from '../UpgradeCardPicker';
import {canUpgrade,canRemoveCard} from '../../../src/core/engine/shared';
import { font, size, space } from '../../theme';
import {levelUpConfirmLabel} from '../../levelUpPresentation';

/**
 * หน้าเลือกรางวัลตอนเลเวลอัป
 *
 * engine เตรียม state.levelUp ไว้ให้ตั้งแต่แรกแล้ว (ทั้งคู่ตัวเลือกและการ์ด/พรที่สุ่มมา)
 * แต่ก่อนหน้านี้ไม่มี UI — phase 'levelup' ถูก VictoryOverlay กลืนไป
 * ผู้เล่นจึงไม่เคยได้เลือกเลย
 */

/** คำอธิบายของแต่ละตัวเลือก — ตรงกับ applyBucketChoice ใน handlers/level.ts */
const BUCKET_LABEL: Record<string, { title: string; detail: string }> = {
  max_hp:         { title: 'พลังชีวิต',      detail: 'ชีวิตสูงสุด +8 · ฟื้นทันที 8' },
  max_energy:     { title: 'พลังงาน',        detail: 'พลังงานต่อเทิร์น +1' },
  max_hand:       { title: 'ขนาดมือ',        detail: 'จั่วการ์ดได้มากขึ้น 1 ใบต่อเทิร์น' },
  blessing:       { title: 'พร',             detail: 'รับพรติดตัว 1 อย่าง' },
  remove:         { title: 'สละการ์ด',       detail: 'ถอดการ์ดออกจากสำรับ' },
  upgrade:        { title: 'ปลุกเสก',        detail: 'อัปเกรดการ์ดในสำรับ' },
  gold:           { title: 'ทรัพย์',         detail: 'รับเบี้ยเพิ่ม' },
  equipment_slot: { title: 'ช่องเครื่องราง', detail: 'พกเครื่องรางเพิ่ม 1 ชิ้น' },
  gold_skip:      { title: 'ข้ามรับเบี้ย',     detail: 'ไม่รับอะไร แลกกับเบี้ย' },
};

const labelOf = (bucket: string) =>
  BUCKET_LABEL[bucket] ?? { title: bucket, detail: '' };

/** ตัวเลือกที่ต้องเลือกของย่อยอีกชั้น */
const NEEDS_PICK = new Set(['blessing','upgrade','remove']);

type Props = {
  state: GameState;
  playerLevel: number;
  onChoose: (option: 'A' | 'B', index?: number) => void;
  onSkip: () => void;
};

export default function LevelUpOverlay({ state, playerLevel, onChoose, onSkip }: Props) {
  const choice = state.levelUp?.choice;
  // ตัวเลือกไหนที่ผู้เล่นกดค้างไว้เพื่อเลือกของย่อยต่อ
  const [selected,setSelected]=React.useState<'A'|'B'|null>(null);
  const [pending, setPending] = React.useState<'A' | 'B' | null>(null);

  const [cardIndex,setCardIndex]=React.useState<number|null>(null);
  if (!choice) return null;

  const bucketOf = (opt: 'A' | 'B') => (opt === 'A' ? choice.optionA : choice.optionB);

  const deck = state.masterDeck ?? [];
  /** ในสำรับตอนนี้มีการ์ด id นี้อยู่กี่ใบ */
  const ownedCount = (id: string) => deck.filter(c => c.id === id).length;

  type SubChoice = {
    key: string;
    title: string;
    detail: string;
    /** ตัวเลือกที่เป็นการ์ดจริง — แสดงเต็มใบแทนที่จะเป็นแค่ชื่อ */
    card?: CardData;
  };

  const subChoices = (opt: 'A' | 'B'): SubChoice[] => {
    const bucket = bucketOf(opt);
    if (bucket === 'blessing') {
      return (state.levelUp?.blessingChoices ?? []).map((b, i) => ({
        key: b.id ?? `${i}`,
        title: b.name ?? b.id,
        detail: b.desc ?? '',
      }));
    }
    return [];
  };

  const press = (opt: 'A' | 'B') => {
    if (bucketOf(opt)==='upgrade'||bucketOf(opt)==='remove'||(NEEDS_PICK.has(bucketOf(opt)) && subChoices(opt).length > 0)) {
      setPending(opt);   // ต้องเลือกของย่อยก่อน
      return;
    }
    onChoose(opt);
  };

  return (
    <PostBattleSurface mat>
      <RitualSurface kind="quietSlate" style={{paddingVertical:18,marginBottom:10}}>
        <Text style={{color:palette.moon,fontSize:24,textAlign:'center',fontFamily:font.heading}}>เลเวล {playerLevel}</Text>
      </RitualSurface>
      <Text style={{color:palette.text,fontSize:14,fontFamily:font.ui,textAlign:'center',marginBottom:20}}>
        {pending ? bucketOf(pending)==='upgrade'?'เลือกการ์ดที่จะปลุกเสกฟรี 1 ใบ':bucketOf(pending)==='remove'?'เลือกการ์ดที่จะสละ 1 ใบ':'เลือกพรหนึ่งอย่าง' : 'เลือกสิ่งที่จะรับเมื่อเลเวลเพิ่ม'}
      </Text>

      {pending === null ? (
        <View style={{gap:16}}>
          <View style={{flexDirection:'row',gap:12,alignItems:'stretch'}}>
          {(['A','B'] as const).map(opt=>{
            const bucket=bucketOf(opt);const l=labelOf(bucket);const picked=selected===opt;
            const image=bucket==='equipment_slot'||bucket==='blessing'?require('../../../assets/ui/blessing-amulet.png')
              :bucket==='max_hp'?require('../../../assets/ui/blessing-herb-object.png')
              :bucket==='gold'||bucket==='gold_skip'?require('../../../assets/ui/ritual-jar.png')
              :bucket==='upgrade'?RITUAL_OBJECTS.upgrade:bucket==='remove'?RITUAL_OBJECTS.remove
              :bucket==='max_hand'?require('../../../assets/images/players/iMaxHand.png'):require('../../../assets/ui/ritual-jar.png');
            const unavailable=bucket==='upgrade'?!deck.some(canUpgrade):bucket==='remove'?!deck.some(c=>canRemoveCard(c,deck.length)):false;
            return <Pressable disabled={unavailable} key={opt} accessibilityRole="button" accessibilityLabel={`${l.title}${picked?' · เลือกไว้แล้ว':''}`} accessibilityState={{selected:picked,disabled:unavailable}}
              onPress={()=>setSelected(opt)} style={{flex:1}}>
              <CandleSelection selected={picked} dim={!!selected&&!picked}><RitualSurface kind="quietSlate" style={{flex:1,minHeight:235,paddingHorizontal:14,paddingVertical:18}}>
                <Image accessible={false} source={image} resizeMode="contain" style={{width:72,height:72,alignSelf:'center',marginBottom:12}}/>
                <Text style={{fontFamily:font.heading,color:palette.moon,fontSize:17,textAlign:'center'}}>{l.title}</Text>
                <Text style={{fontFamily:font.ui,color:palette.text,fontSize:13,lineHeight:22,textAlign:'center',marginTop:8}}>{unavailable?'ไม่มีการ์ดที่เลือกได้':l.detail}</Text>
                <View style={{minHeight:28,marginTop:10,justifyContent:'center'}}>
                  {picked&&<Text style={{fontFamily:font.heading,color:palette.bloodLit,fontSize:12,textAlign:'center'}}>✓ เลือกไว้แล้ว</Text>}
                </View>
              </RitualSurface></CandleSelection>
            </Pressable>;
          })}
          </View>
          <QuietButton label={levelUpConfirmLabel(selected?bucketOf(selected):undefined)} primary disabled={!selected} onPress={()=>selected&&press(selected)}/>
        </View>
      ) : (
        <View>
          {(bucketOf(pending)==='upgrade'||bucketOf(pending)==='remove')?<View style={{gap:16}}>
            <UpgradeCardPicker cards={deck} selected={cardIndex} onSelect={setCardIndex} remove={bucketOf(pending)==='remove'} onConfirm={i=>onChoose(pending,i)}/>
          </View>:<View style={{gap:14}}>
            <View style={{flexDirection:'row',gap:10,alignItems:'stretch'}}>
             {(state.levelUp?.blessingChoices??[]).map((b,i)=><Pressable key={b.id} testID={`level-blessing-${i}`} accessibilityRole="button" accessibilityLabel={`เลือกพร ${b.name}`} onPress={()=>setCardIndex(i)} style={{flex:1}}>
              <CandleSelection selected={cardIndex===i} dim={cardIndex!==null&&cardIndex!==i}><RitualSurface kind="quietSlate" style={{height:278,padding:12,gap:8}}>
               <Image source={objectSource(b)} resizeMode="contain" style={{width:76,height:76,alignSelf:'center'}}/>
               <Text style={{height:48,color:palette.moon,fontFamily:font.heading,fontSize:16,lineHeight:24,textAlign:'center'}}>{b.name}</Text>
               <ScrollView><Text style={{color:palette.text,fontFamily:font.ui,fontSize:13,lineHeight:22,textAlign:'center'}}>{b.desc}</Text></ScrollView>
              </RitualSurface></CandleSelection>
             </Pressable>)}
            </View>
            <QuietButton label="ยืนยันรับพร" primary disabled={cardIndex===null} onPress={()=>cardIndex!==null&&onChoose(pending,cardIndex)}/>
          </View>}

          <QuietButton label="ย้อนกลับ" onPress={()=>{setPending(null);setCardIndex(null);}} style={{marginTop:14}}/>
        </View>
      )}

      <QuietButton label="ข้ามไปก่อน" onPress={onSkip} style={{marginTop:18}}/>
    </PostBattleSurface>
  );
}
