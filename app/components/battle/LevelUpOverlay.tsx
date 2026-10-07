import {palette,surface} from '../../theme';
import PostBattleSurface from './PostBattleSurface';
import RitualSurface from '../RitualSurface';
import {GameButton} from '../Panel';
import {Image} from 'react-native';
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { CardData, GameState } from '../../../src/core/types';
import CardRow from '../CardRow';
import { font, size, space } from '../../theme';

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
const NEEDS_PICK = new Set(['blessing']);

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
    if (NEEDS_PICK.has(bucketOf(opt)) && subChoices(opt).length > 0) {
      setPending(opt);   // ต้องเลือกของย่อยก่อน
      return;
    }
    onChoose(opt);
  };

  return (
    <PostBattleSurface mat>
      <RitualSurface kind="wood" style={{paddingVertical:18,marginBottom:10}}>
        <Text style={{color:palette.moon,fontSize:24,textAlign:'center',fontFamily:font.heading}}>เลเวล {playerLevel}</Text>
      </RitualSurface>
      <Text style={{color:palette.text,fontSize:14,fontFamily:font.ui,textAlign:'center',marginBottom:20}}>
        {pending ? 'เลือกพรหนึ่งอย่าง' : 'เลือกวิชาที่จะพัฒนา'}
      </Text>

      {pending === null ? (
        <View style={{gap:20}}>
          <View style={{flexDirection:'row',gap:12,alignItems:'stretch'}}>
          {(['A','B'] as const).map(opt=>{
            const bucket=bucketOf(opt);const l=labelOf(bucket);const picked=selected===opt;
            const image=bucket==='equipment_slot'||bucket==='blessing'?require('../../../assets/ui/blessing-amulet.png')
              :bucket==='max_hp'?require('../../../assets/ui/blessing-herb-object.png')
              :bucket==='gold'||bucket==='gold_skip'?require('../../../assets/ui/ritual-jar.png')
              :bucket==='upgrade'||bucket==='remove'?require('../../../assets/ui/ritual-knife.png')
              :require('../../../assets/ui/card-breath.png');
            return <Pressable key={opt} accessibilityRole="button" accessibilityLabel={`${l.title}${picked?' · เลือกไว้แล้ว':''}`} accessibilityState={{selected:picked}}
              onPress={()=>setSelected(opt)} style={{flex:1}}>
              <Image accessible={false} source={image} resizeMode="contain" style={{width:'100%',height:140,marginBottom:12}}/>
              <RitualSurface kind="darkCloth" style={{flex:1,minHeight:180,paddingHorizontal:17,paddingVertical:20}}>
                <Text style={{fontFamily:font.heading,color:palette.moon,fontSize:17,textAlign:'center'}}>{l.title}</Text>
                <Text style={{fontFamily:font.ui,color:palette.text,fontSize:13,lineHeight:22,textAlign:'center',marginTop:8}}>{l.detail}</Text>
                <View style={{minHeight:28,marginTop:10,justifyContent:'center'}}>
                  {picked&&<Text style={{fontFamily:font.heading,color:palette.bloodLit,fontSize:12,textAlign:'center'}}>✓ เลือกไว้แล้ว</Text>}
                </View>
              </RitualSurface>
            </Pressable>;
          })}
          </View>
          <GameButton label="ยืนยันวิชา" tone="primary" disabled={!selected} onPress={()=>selected&&press(selected)}/>
        </View>
      ) : (
        <View>
          <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ gap: 12 }}>
            {subChoices(pending).map((sc, i) => (
              <Pressable
                key={sc.key}
                onPress={() => onChoose(pending, i)}
                style={{
                  padding: sc.card ? 0 : 16, borderRadius: 14,
                  backgroundColor: surface.panel,
                  borderWidth: sc.card ? 0 : 1, borderColor: palette.line,
                }}
              >
                {sc.card ? (
                  <View>
                    <CardRow card={sc.card} />
                    {/* ซ้ำใบเดิมไม่ได้แปลว่าแย่ — บางทีเราตั้งใจถือใบเดิมหลายใบ
                        แต่ต้องรู้ตัวว่ากำลังทำอยู่ */}
                    {ownedCount(sc.card.id) > 0 && (
                      <Text style={{
                        color: palette.moonDim, fontSize: size.tiny,
                        fontFamily: font.ui, marginTop: 2, marginLeft: space.md,
                      }}>
                        มีอยู่แล้ว {ownedCount(sc.card.id)} ใบ
                      </Text>
                    )}
                  </View>
                ) : (
                  <>
                    <Text style={{ color: palette.text, fontSize: 16, fontFamily: 'Prompt_600SemiBold' }}>
                      {sc.title}
                    </Text>
                    {!!sc.detail && (
                      <Text style={{ color: palette.textDim, fontFamily:font.ui,fontSize: 13, marginTop: 4 }}>
                        {sc.detail}
                      </Text>
                    )}
                  </>
                )}
              </Pressable>
            ))}
          </ScrollView>

          <Pressable onPress={() => setPending(null)} style={{ marginTop: 14, alignSelf: 'center' }}>
            <Text style={{ color: palette.textDim, fontFamily:font.ui,fontSize: 14 }}>◂ ย้อนกลับ</Text>
          </Pressable>
        </View>
      )}

      <Pressable onPress={onSkip} style={{ marginTop: 22, alignSelf: 'center' }}>
        <Text style={{ color: palette.text, fontSize: 13, fontFamily:font.ui }}>ข้ามไปก่อน</Text>
      </Pressable>
    </PostBattleSurface>
  );
}
