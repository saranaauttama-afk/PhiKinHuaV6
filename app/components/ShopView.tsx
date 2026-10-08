import {visitedScene} from '../scenePresentation';
// app/components/ShopView.tsx — โหนดพักทุกชนิดที่ไม่ใช่เหตุการณ์เล่าเรื่อง
//
// เขียนใหม่ทั้งไฟล์ ของเดิมมีปัญหาสามอย่างพร้อมกัน:
//
// 1. **เป็นภาษาอังกฤษทั้งหมด** ("Card Shop", "Pray for Healing", "Chest is empty")
//    ทั้งที่ทุกหน้าที่เหลือเป็นภาษาไทย
// 2. **สี 37 สีจากพาเลตต์เว็บ** — เขียวมิ้นต์ ฟ้าคราม ม่วง เทาสเลต ไม่มีสีไหน
//    อยู่ในงานอาร์ตของเกมเลย
// 3. **ผสม nativewind className กับ inline style สลับไปมา** ในไฟล์เดียวกัน
//
// พฤติกรรมทุกอย่างเหมือนเดิมเป๊ะ — คำสั่งที่ dispatch, เงื่อนไขที่กดได้/ไม่ได้,
// จำนวนครั้งที่ใช้ได้ ยกมาครบ เปลี่ยนแค่หน้าตากับภาษา

import {palette,surface,paper} from '../theme';
import RitualSurface from './RitualSurface';
import SceneArrival from './SceneArrival';
import UpgradeCardPicker,{upgradeSummary} from './UpgradeCardPicker';
import {upgradeCard} from '../../src/core/engine/shared';
import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import type { CardData, Command, GameState, ShopItem } from '../../src/core/types';
import { removeCostForCount, upgradeCostForCount } from '../../src/core/balance/economy';
import { canUpgrade, upgradeLevelOf, MAX_UPGRADE_LEVEL } from '../../src/core/engine/shared';
import FusionAltarView from './FusionAltarView';
import {QuietButton} from './QuietChrome';
import {CardGlyphArt} from './DeckCard';
import { font, radius, size, space, tint, layer } from '../theme';
import { useScreenPadding } from '../useScreenPadding';

function Panel({title,children}:{title:string;children:React.ReactNode}) {
  return <RitualSurface kind="quietSlate" style={{padding:22,gap:10,width:'100%',minWidth:0}}>
    <Text style={{fontFamily:font.heading,color:palette.moon,fontSize:23,lineHeight:32}}>{title}</Text>
    {children}
  </RitualSurface>;
}

interface ShopViewProps {
  state: GameState;
  dispatch: (cmd: Command) => void;
}

const cardOf = (item: ShopItem): CardData | undefined =>
  'card' in item ? (item.card as CardData) : undefined;

const equipOf = (item: ShopItem): any =>
  'equipment' in item ? item.equipment : undefined;

/** สรุปว่าการ์ดใบนี้ทำอะไร แบบบรรทัดเดียว */
function cardLine(c?: CardData): string {
  if (!c) return '';
  return [
    c.dmg        ? `โจมตี ${c.dmg}`      : '',
    c.block      ? `ป้องกัน ${c.block}`  : '',
    c.heal       ? `ฟื้น ${c.heal}`       : '',
    c.draw       ? `จั่ว ${c.draw}`       : '',
    c.energyGain ? `พลังงาน +${c.energyGain}` : '',
  ].filter(Boolean).join(' · ');
}

function ItemChip({
  title, line, note, onPress, card, wide = false, disabled = false,
}: {
  title: string; line?: string; note?: string; onPress: () => void;
  wide?: boolean; disabled?: boolean; card?:CardData;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title+(note?' · '+note:'')} onPress={onPress} disabled={disabled} accessibilityState={{disabled}} style={{width:'48%',minHeight:164}}>
    <RitualSurface kind="quietSlate" style={{flex:1,padding:14,gap:5,alignItems:'center'}}>
      {card?<CardGlyphArt card={card} size={72} muted={disabled}/>:<Image accessible={false} source={require('../../assets/ui/blessing-amulet.png')} resizeMode="contain" style={{width:72,height:72,opacity:disabled?.55:1}}/>}
      <Text style={{color:palette.moon,fontSize:14,fontFamily:font.heading,textAlign:'center'}}>{title}</Text>
      {!!line&&<Text style={{color:palette.text,fontSize:12,lineHeight:20,fontFamily:font.ui,textAlign:'center'}}>{line}</Text>}
      {!!note&&<Text style={{color:palette.moonDim,fontSize:12,fontFamily:font.ui,textAlign:'center'}}>{note}</Text>}
      {disabled&&<Text style={{color:palette.textDim,fontSize:11,fontFamily:font.ui}}>เบี้ยไม่พอ</Text>}
    </RitualSurface>
  </Pressable>;
}

/** บรรทัดบอกว่าทำไมตอนนี้ยังใช้ไม่ได้ */
function Unavailable({text}:{text:string}) {
 return <RitualSurface kind="quietSlate" style={{padding:20,minHeight:70,justifyContent:'center'}}><Text style={{fontFamily:font.ui,color:palette.text,fontSize:14,lineHeight:24,textAlign:'center'}}>{text}</Text></RitualSurface>;
}

function Money({ state }: { state: GameState }) {
  return (
    <Text style={{
      color: palette.moonDim, fontSize: size.label,
      fontFamily: font.ui, marginBottom: space.md,
    }}>
      เบี้ยในย่าม {state.player.gold ?? 0}
    </Text>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{
      color: palette.textDim, fontSize: 14,
      fontFamily: font.ui, lineHeight: 25, marginBottom: space.md,
    }}>
      {children}
    </Text>
  );
}

export default function ShopView({ state, dispatch }: ShopViewProps) {
  const pad = useScreenPadding();
  const [selected,setSelected]=React.useState<number|null>(null);
  const [notice,setNotice]=React.useState('');
  React.useEffect(()=>{setSelected(null);setNotice('');},[state.phase,state.shopKind,state.currentShopId]);
  if (state.phase !== 'shop') return null;
  const kind = state.shopKind;

  const deck = state.masterDeck ?? [];
  const stock = state.shopStock ?? [];

  const cardShop = () => (
    <Panel title="ร้านขายคาถา">
      <Lead>พ่อค้าเร่กางผ้าขายม้วนคาถาอยู่ริมทาง ของทุกชิ้นเก่าแต่ยังใช้ได้</Lead>
      <Money state={state} />
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        {stock.map((item, i) => (
          <ItemChip
            key={i}
            card={cardOf(item)}
            disabled={(state.player.gold??0)<item.price}
            title={cardOf(item)?.name ?? 'ของไม่ทราบชนิด'}
            line={cardLine(cardOf(item))}
            note={`${item.price} เบี้ย`}
            onPress={() => dispatch({ type: 'TakeShop', index: i })}
          />
        ))}
      </View>
      <QuietButton
        label="ขอดูของชุดใหม่ (50 เบี้ย)"
        onPress={() => dispatch({ type: 'ShopReroll' })}
        style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
      />
    </Panel>
  );

  const equipmentShop = () => (
    <Panel title="ร้านเครื่องราง">
      <Lead>ตะกรุด ลูกประคำ ผ้ายันต์ วางเรียงบนผ้าขาว เจ้าของร้านไม่พูดอะไรสักคำ</Lead>
      <Money state={state} />
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        {stock.map((item, i) => (
          <ItemChip
            key={i}
            disabled={(state.player.gold??0)<item.price}
            title={equipOf(item)?.name ?? 'ของไม่ทราบชนิด'}
            line={equipOf(item)?.desc}
            note={`${item.price} เบี้ย · ${equipOf(item)?.rarity ?? ''}`}
            onPress={() => dispatch({ type: 'TakeShopEquipment', index: i })}
            wide
          />
        ))}
      </View>
    </Panel>
  );

  const removeShop = () => {
    const count = state.runCounters?.removeShopCount ?? 0;
    const cost = removeCostForCount(count);
    return (
      <Panel title="สละการ์ด">
        <Lead>กองไฟเล็กๆ ริมทาง เผาสิ่งที่ไม่อยากแบกต่อได้ที่นี่</Lead>
        <Money state={state} />
        <Text style={{ color: palette.moonDim, fontSize: size.label, marginBottom: space.md, fontFamily: font.ui }}>
          ค่าเผา {cost} เบี้ย · สละไปแล้ว {count} ใบ
        </Text>
        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          {deck.map((card, i) => (
            <ItemChip
              key={i}
              card={card}
              disabled={(state.player.gold??0)<cost}
              title={card.name || card.id}
              line={cardLine(card)}
              onPress={() => dispatch({ type: 'ShopRemoveBuy', index: i })}
            />
          ))}
        </View>
      </Panel>
    );
  };

  const upgradeShop = () => {
    const count=state.runCounters?.upgradeShopCount??0;
    const card=selected===null?undefined:deck[selected];
    const price=card?upgradeCostForCount(count+upgradeLevelOf(card)):0;
    const available=!!card&&canUpgrade(card)&&(state.player.gold??0)>=price;
    return <Panel title="ปลุกเสกการ์ด">
      <Lead>เลือกหนึ่งใบ ดูผลหลังปลุกเสก แล้วกดยืนยัน</Lead>
      <Money state={state}/>
      {!!notice&&<Text accessibilityLiveRegion="polite" style={{fontFamily:font.ui,color:palette.moon,fontSize:14,lineHeight:24}}>{notice}</Text>}
      <UpgradeCardPicker cards={deck} selected={selected} onSelect={setSelected} price={c=>upgradeCostForCount(count+upgradeLevelOf(c))} disabledConfirm={!available} onConfirm={index=>{
        const target=deck[index];const cost=upgradeCostForCount(count+upgradeLevelOf(target));
        if(!canUpgrade(target)||(state.player.gold??0)<cost)return;
        const next=upgradeCard(target);dispatch({type:'ShopUpgradeBuy',index});
        setNotice(`ปลุกเสกสำเร็จ · ${next.name}\n${upgradeSummary(next)}`);setSelected(null);
      }}/>
      {card&&!available&&<Text style={{fontFamily:font.ui,color:palette.bloodLit,fontSize:13}}>เบี้ยไม่พอ หรือการ์ดสุดขั้นแล้ว</Text>}
    </Panel>;
  };

  const healingShrine = () => {
    // เงื่อนไขเดิมทุกข้อ ไม่ได้เปลี่ยนตัวเลข
    const used = (state as any).healingShrine?.timesUsed ?? 0;
    const cost = 25 + used * 10;
    const maxUses = 3;
    const missing = state.player.maxHp - state.player.hp;
    const canUse = used < maxUses && (state.player.gold ?? 0) >= cost && missing > 0;

    return (
      <Panel title="ศาลพักใจ">
        {!!notice&&<Text accessibilityLiveRegion="polite" style={{fontFamily:font.ui,color:palette.moon,fontSize:14,lineHeight:24}}>{notice}</Text>}
        <Lead>ศาลไม้เล็กๆ ใต้ต้นโพธิ์ ผ้าแพรสีซีดพลิ้วอยู่ทั้งที่ไม่มีลม</Lead>
        <Text style={{ color: palette.textDim, fontSize: size.label, marginBottom: space.md, fontFamily: font.ui }}>
          เบี้ย {state.player.gold ?? 0} · เลือด {state.player.hp}/{state.player.maxHp} · ใช้ได้อีก {Math.max(0, maxUses - used)} ครั้ง
        </Text>

        {canUse ? (
          <QuietButton
            label={`ขอพร ${cost} เบี้ย (ฟื้น ${missing})`}
            primary
            onPress={() => {dispatch({ type: 'UseHealingShrine' });setNotice(`พักฟื้นแล้ว · ชีวิต ${state.player.maxHp}/${state.player.maxHp}`);}}
          />
        ) : (
          <Unavailable
            text={
              used >= maxUses ? 'ศาลนี้หมดแรงแล้ว'
              : missing <= 0 ? 'เลือดเต็มอยู่แล้ว'
              : 'เบี้ยไม่พอ'
            }
          />
        )}
      </Panel>
    );
  };

  const well = () => {
    const used = (state as any).mysticalWell?.timesUsed ?? 0;
    const maxUses = 2;
    const canUse = used < maxUses && state.player.hp < state.player.maxHp;

    return (
      <Panel title="บ่อน้ำลึกลับ">
        <Lead>บ่อหินเก่าปากกว้าง น้ำข้างในนิ่งจนเห็นเงาตัวเองชัดเกินไป</Lead>
        <Text style={{ color: palette.textDim, fontSize: size.label, marginBottom: space.md, fontFamily: font.ui }}>
          เลือด {state.player.hp}/{state.player.maxHp} · ตักได้อีก {Math.max(0, maxUses - used)} ครั้ง
        </Text>

        {canUse ? (
          <QuietButton
            label="ตักขึ้นมาดื่ม (ฟื้น 10 · ไม่เสียเบี้ย)"
            primary
            onPress={() => dispatch({ type: 'UseWell' })}
          />
        ) : (
          <Unavailable text={used >= maxUses ? 'บ่อแห้งแล้ว' : 'เลือดเต็มอยู่แล้ว'} />
        )}
      </Panel>
    );
  };

  const treasure = () => (
    <Panel title="หีบสมบัติ">
      <Lead>หีบไม้เก่าเปิดแง้มอยู่ มีแสงลอดออกมาจากในนั้น — เลือกได้อย่างเดียว</Lead>
      {stock.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          {stock.map((item, i) => (
            <ItemChip
              key={i}
              card={cardOf(item)}
              title={cardOf(item)?.name ?? 'ของไม่ทราบชนิด'}
              line={cardLine(cardOf(item))}
              note="หยิบฟรี"
              onPress={() => dispatch({ type: 'TakeTreasureCard', index: i })}
              wide
            />
          ))}
        </View>
      ) : (
        <Unavailable text="หีบว่างเปล่า" />
      )}
    </Panel>
  );

  const singleTreasure = () => {
    const randomized = (state as any)._singleTreasureRandomized ?? false;
    return (
      <Panel title="สมบัติชิ้นเดียว">
        <Lead>ห่อผ้าเล็กๆ วางบนตอไม้ ข้างในมีของอยู่ชิ้นเดียว</Lead>
        {stock.length > 0 ? (
          <>
            <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
              {stock.map((item, i) => (
                <ItemChip
                  key={i}
                  card={cardOf(item)}
                  title={cardOf(item)?.name ?? 'ของไม่ทราบชนิด'}
                  line={cardLine(cardOf(item))}
                  note="หยิบฟรี"
                  onPress={() => dispatch({ type: 'TakeSingleTreasureCard', index: i })}
                  wide
                />
              ))}
            </View>
            <QuietButton
              label={randomized ? 'เปลี่ยนไปแล้ว' : 'ขอเปลี่ยนของ (ได้ครั้งเดียว)'}
              disabled={randomized}
              onPress={() => dispatch({ type: 'RandomizeSingleTreasure' })}
              style={{ marginTop: space.lg, alignSelf: 'flex-start' }}
            />
          </>
        ) : (
          <Unavailable text="ห่อผ้าว่างเปล่า" />
        )}
      </Panel>
    );
  };

  const background=visitedScene(state).source;
  const object=kind==='healing'||kind==='well'?require('../../assets/ui/blessing-shrine-object.png'):kind==='upgrade'||kind==='remove'?require('../../assets/ui/ritual-knife.png'):require('../../assets/ui/ritual-jar.png');
  return <View style={{position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:layer.overlay}}>
    <SceneArrival instant sceneKey={`rest-${state.currentShopId??kind}`} source={background}>
      <View style={{flex:1,backgroundColor:surface.glassDim}}>
        <ScrollView style={{flex:1}} contentContainerStyle={{paddingHorizontal:16,paddingTop:pad.top+20,paddingBottom:24,gap:12}}>
          <Image accessible={false} source={object} resizeMode="contain" style={{width:'100%',height:kind==='healing'||kind==='well'?150:100}}/>
          {kind === 'card'            && cardShop()}
          {kind === 'equipment'       && equipmentShop()}
          {kind === 'remove'          && removeShop()}
          {kind === 'upgrade'         && upgradeShop()}
          {kind === 'healing'         && healingShrine()}
          {kind === 'well'            && well()}
          {kind === 'treasure'        && treasure()}
          {kind === 'treasure_single' && singleTreasure()}
          {kind === 'fusion'          && <FusionAltarView state={state} dispatch={dispatch} />}
        </ScrollView>
        <View style={{paddingHorizontal:16,paddingTop:8,paddingBottom:pad.bottom+12}}>
          <QuietButton label="กลับจุดพัก" primary onPress={()=>dispatch({type:'CompleteNode'})}/>
        </View>
      </View>
    </SceneArrival>
  </View>;
}
