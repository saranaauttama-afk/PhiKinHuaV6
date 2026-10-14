import {shopObject} from './EncounterArt';
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
import { BackHandler, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import RewardReceiptView from './RewardReceiptView';
import type { CardData, Command, GameState, ShopItem } from '../../src/core/types';
import { SHOP_REROLL_COST } from '../../src/core/balance/economy';
import { ECONOMY } from '../../src/core/balance/notfm';
import { canUpgrade, upgradeLevelOf, MAX_UPGRADE_LEVEL } from '../../src/core/engine/shared';
import {QuietButton} from './QuietChrome';
import CloseSeal from './CloseSeal';
import DeckCard,{CardGlyphArt,CardFace} from './DeckCard';
import {canRemoveCard} from '../../src/core/engine/shared';
import { font, radius, size, space, tint, layer } from '../theme';
import { useScreenPadding } from '../useScreenPadding';
import {describeCard,describeBlessing,TYPE_LABEL} from '../../src/core/cards/describe';
import {shopPrice,markedUp,removePrice,upgradePrice,shrineCost,wellHeal,healAmount} from '../../src/core/engine/handlers/shops_events';

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
  React.useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{if(selected!==null)setSelected(null);else dispatch({type:'CompleteNode'});return true;});return ()=>sub.remove();},[selected,dispatch]);
  const [notice,setNotice]=React.useState('');
  React.useEffect(()=>{setSelected(null);setNotice('');},[state.phase,state.shopKind,state.currentShopId]);
  if (state.phase !== 'shop') return null;
  const kind = state.shopKind;

  const deck = state.masterDeck ?? [];
  const stock = state.shopStock ?? [];

  const cardShop = (title = 'ร้านค้า') => {
    const item=selected===null?undefined:stock[selected];const card=item?cardOf(item):undefined;
    return <Panel title={title}>
      <Lead>แตะการ์ดเพื่ออ่าน แล้วกดยืนยันซื้อ · ยังไม่เสียเบี้ยจนกว่าจะยืนยัน</Lead><Money state={state}/>
      {!!notice&&<Text accessibilityLiveRegion="polite" style={{color:palette.moon,fontFamily:font.ui}}>{notice}</Text>}
      <View style={{flexDirection:'row',gap:10,flexWrap:'wrap'}}>{stock.map((it,i)=>{const c=cardOf(it);return c&&<View testID={`shop-card-${i}`} key={`${c.id}-${i}`} style={{width:'48%',gap:4}}>
        <View><DeckCard fullWidth card={c} selected={selected===i} dim={selected!==null&&selected!==i} onPress={()=>setSelected(i)}/></View>
        <Text style={{color:palette.moon,fontFamily:font.heading,textAlign:'center',fontSize:14}}>ราคา {shopPrice(state,it.price)} เบี้ย{shopPrice(state,it.price)<it.price?` (จาก ${it.price})`:''}</Text>
      </View>;})}</View>
      <QuietButton label={`ขอดูของชุดใหม่ (${markedUp(state,SHOP_REROLL_COST)} เบี้ย)`} disabled={(state.player.gold??0)<markedUp(state,SHOP_REROLL_COST)} onPress={()=>{setSelected(null);dispatch({type:'ShopReroll'});}}/>
    </Panel>;
  };

  const removeShop = () => {
    const cost=removePrice(state);
    return <Panel title="ศาลาลืมเลือน"><Lead>เลือกและอ่านการ์ดก่อนยืนยันสละ · ใบแรกฟรี ใบต่อไป {markedUp(state,ECONOMY.removePrice)} เบี้ย</Lead><Money state={state}/>
      {!!notice&&<Text accessibilityLiveRegion="polite" style={{fontFamily:font.ui,color:palette.moon}}>{notice}</Text>}
      <UpgradeCardPicker cards={deck} selected={selected} onSelect={setSelected} remove price={()=>cost} disabledConfirm={(state.player.gold??0)<cost} onConfirm={index=>{if(!canRemoveCard(deck[index],deck.length)||(state.player.gold??0)<cost)return;const name=deck[index].name;dispatch({type:'ShopRemoveBuy',index});setSelected(null);setNotice(`สละ ${name} แล้ว`);}}/>
    </Panel>;
  };

  const upgradeShop = () => {
    const card=selected===null?undefined:deck[selected];
    const price=upgradePrice(state);
    const available=!!card&&canUpgrade(card)&&(state.player.gold??0)>=price;
    return <Panel title="ช่างปลุกเสก">
      <Lead>เลือกหนึ่งใบ ดูผลหลังปลุกเสก แล้วกดยืนยัน · ใบแรกฟรี ใบต่อไป {markedUp(state,ECONOMY.upgradePrice)} เบี้ย</Lead>
      <Money state={state}/>
      {!!notice&&<Text accessibilityLiveRegion="polite" style={{fontFamily:font.ui,color:palette.moon,fontSize:14,lineHeight:24}}>{notice}</Text>}
      <UpgradeCardPicker cards={deck} selected={selected} onSelect={setSelected} price={()=>price} disabledConfirm={!available} onConfirm={index=>{
        const target=deck[index];const cost=price;
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
    const cost = shrineCost(state);
    const maxUses = ECONOMY.shrine.uses;
    const missing = healAmount(state, state.player.maxHp - state.player.hp);
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
            onPress={() => {dispatch({ type: 'UseHealingShrine' });setNotice(`พักฟื้นแล้ว · ชีวิต +${missing}`);}}
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
    const maxUses = ECONOMY.well.uses;
    const canUse = used < maxUses && state.player.hp < state.player.maxHp;

    return (
      <Panel title="บ่อน้ำลึกลับ">
        <Lead>บ่อหินเก่าปากกว้าง น้ำข้างในนิ่งจนเห็นเงาตัวเองชัดเกินไป</Lead>
        <Text style={{ color: palette.textDim, fontSize: size.label, marginBottom: space.md, fontFamily: font.ui }}>
          เลือด {state.player.hp}/{state.player.maxHp} · ตักได้อีก {Math.max(0, maxUses - used)} ครั้ง
        </Text>

        {canUse ? (
          <QuietButton
            label={`ตักขึ้นมาดื่ม (ฟื้น ${wellHeal(state)} · ไม่เสียเบี้ย)`}
            primary
            onPress={() => dispatch({ type: 'UseWell' })}
          />
        ) : (
          <Unavailable text={used >= maxUses ? 'บ่อแห้งแล้ว' : 'เลือดเต็มอยู่แล้ว'} />
        )}
      </Panel>
    );
  };

  const treasure = (single=false) => {
    const item=selected===null?undefined:stock[selected],card=item?cardOf(item):undefined;
    const randomized=(state as any)._singleTreasureRandomized??false;
    return <Panel title={single?'สมบัติชิ้นเดียว':'หีบสมบัติ'}>
      <Lead>แตะการ์ดเพื่ออ่าน · เลือกได้หนึ่งใบ แล้วกดยืนยันรับการ์ด</Lead>
      {stock.length?<View style={{flexDirection:'row',gap:10,flexWrap:'wrap'}}>
       {stock.map((it,i)=>{const c=cardOf(it);return c&&<View testID={`shop-card-${i}`} key={`${c.id}-${i}`} style={{width:'48%',gap:4}}><DeckCard fullWidth card={c} selected={selected===i} dim={selected!==null&&selected!==i} onPress={()=>setSelected(i)}/><Text style={{fontFamily:font.ui,color:palette.moon,textAlign:'center'}}>หยิบฟรี</Text></View>;})}
      </View>:<Unavailable text="หีบว่างเปล่า"/>}
      <Modal visible={!!card} transparent animationType="fade" onRequestClose={()=>setSelected(null)}>
       <View style={{flex:1,backgroundColor:palette.scrimHeavy,justifyContent:'center',padding:24}}>
        <Pressable accessibilityLabel="ปิดรายละเอียดการ์ดสมบัติ" onPress={()=>setSelected(null)} style={{position:'absolute',top:0,bottom:0,left:0,right:0}}/>
        <View accessibilityViewIsModal style={{maxHeight:'90%',gap:10}}>
         <ScrollView>{card&&<CardFace card={card}/>}</ScrollView>
         <QuietButton label="รับการ์ด" primary onPress={()=>{if(selected===null||!card)return;dispatch({type:single?'TakeSingleTreasureCard':'TakeTreasureCard',index:selected});setSelected(null);}}/>
         <QuietButton label="ยกเลิกการเลือก" onPress={()=>setSelected(null)}/>
        </View>
       </View>
      </Modal>
      {single&&stock.length>0&&<QuietButton label={randomized?'เปลี่ยนไปแล้ว':'ขอเปลี่ยนของ (ได้ครั้งเดียว)'} disabled={randomized} onPress={()=>{setSelected(null);dispatch({type:'RandomizeSingleTreasure'});}}/>}
    </Panel>;
  };

  const blessingStop = () => {
    const list=state.blessingStock??[];const pick=selected===null?undefined:list[selected];
    return <Panel title="ศาลพร">
      <Lead>ศาลเพียงตาหลังเก่า ธูปสามดอกยังไม่มอด · เลือกรับพรได้หนึ่งอย่าง</Lead>
      {list.length?<View style={{gap:8}}>{list.map((b,i)=><Pressable key={b.id} testID={`blessing-stop-${i}`} accessibilityRole="button" accessibilityLabel={b.name} accessibilityState={{selected:selected===i}} onPress={()=>setSelected(i)}>
        <RitualSurface kind="quietSlate" style={{padding:12,gap:4,borderWidth:selected===i?1:0,borderColor:palette.moon,opacity:selected!==null&&selected!==i?.7:1}}>
          <Text style={{fontFamily:font.heading,color:palette.moon,fontSize:15}}>{b.name}</Text>
          <Text style={{fontFamily:font.ui,color:palette.text,fontSize:13,lineHeight:21}}>{describeBlessing(b)}</Text>
        </RitualSurface>
      </Pressable>)}
      <QuietButton testID="blessing-stop-take" label={pick?`รับ ${pick.name}`:'เลือกพรก่อน'} primary disabled={!pick} onPress={()=>{if(selected===null)return;dispatch({type:'TakeShopBlessing',index:selected});setNotice(`ได้พร ${pick!.name}`);setSelected(null);}}/>
      </View>:<Unavailable text={notice||'รับพรจากศาลนี้แล้ว'}/>}
    </Panel>;
  };

  const background=visitedScene(state).source;
  const object=shopObject(kind);
  const purchaseItem=(kind==='card'||kind==='equipment')&&selected!==null?stock[selected]:undefined;
  const purchaseCard=purchaseItem?cardOf(purchaseItem):undefined;
  return <View style={{position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:layer.overlay}}>
    <SceneArrival instant sceneKey={`rest-${state.currentShopId??kind}`} source={background}>
      <View style={{flex:1,backgroundColor:surface.glassDim}}>
        {state.pages?.adventure?.version===5&&<View style={{position:'absolute',top:pad.top+4,right:8,zIndex:layer.control}}><CloseSeal testID="shop-destroy-page" label="ปิดและทำลายเพจร้าน" onPress={()=>dispatch({type:'DeleteShop'})}/></View>}
        <ScrollView style={{flex:1}} contentContainerStyle={{paddingHorizontal:16,paddingTop:pad.top+48,paddingBottom:24,gap:12}}>
          <Image testID="destination-object" accessible={false} source={object} resizeMode="contain" style={{width:'100%',height:kind==='healing'||kind==='well'?150:100}}/>
          <RewardReceiptView receipt={state.rewardReceipt}/>
          {kind === 'card'            && cardShop()}
          {kind === 'equipment'       && cardShop('ร้านเครื่องราง')}
          {kind === 'remove'          && removeShop()}
          {kind === 'upgrade'         && upgradeShop()}
          {kind === 'healing'         && healingShrine()}
          {kind === 'well'            && well()}
          {kind === 'treasure'        && treasure()}
          {kind === 'treasure_single' && treasure(true)}
          {kind === 'blessing'        && blessingStop()}
        </ScrollView>
        {purchaseCard&&purchaseItem&&<RitualSurface testID="shop-purchase-confirmation" kind="occupationPage" style={{marginHorizontal:16,gap:10,maxHeight:'45%'}}>
         <ScrollView style={{flexShrink:1}} contentContainerStyle={{gap:6,paddingBottom:4}}>
         <Text numberOfLines={2} style={{fontFamily:font.heading,color:paper.ink,fontSize:16}}>ยืนยันซื้อ {purchaseCard.name}</Text>
         <Text testID="shop-card-type" style={{fontFamily:font.ui,color:paper.ink,fontSize:12}}>ประเภท: {TYPE_LABEL[purchaseCard.type]}</Text>
         <Text style={{fontFamily:font.ui,color:paper.ink,fontSize:13,lineHeight:20}}>{describeCard(purchaseCard)}{purchaseCard.flavor?` · ${purchaseCard.flavor}`:''}</Text>
         <Text style={{fontFamily:font.ui,color:paper.ink,fontSize:13}}>ราคา {shopPrice(state,purchaseItem.price)} เบี้ย · มี {state.player.gold} เบี้ย{state.player.gold<shopPrice(state,purchaseItem.price)?' · เบี้ยไม่พอ':''}</Text>
         </ScrollView>
         <View style={{flexDirection:'row',gap:8}}><QuietButton label={`ยืนยันซื้อ ${shopPrice(state,purchaseItem.price)} เบี้ย`} primary disabled={state.player.gold<shopPrice(state,purchaseItem.price)} style={{flex:2}} onPress={()=>{if(selected===null||state.player.gold<shopPrice(state,purchaseItem.price))return;dispatch({type:'TakeShop',index:selected});setSelected(null);setNotice(`ซื้อ ${purchaseCard.name} แล้ว`);}}/><QuietButton label="ยกเลิก" style={{flex:1}} onPress={()=>setSelected(null)}/></View>
        </RitualSurface>}
        <View style={{paddingHorizontal:16,paddingTop:8,paddingBottom:pad.bottom+12}}>
          <QuietButton label="กลับจุดพัก" primary onPress={()=>dispatch({type:'CompleteNode'})}/>
        </View>
      </View>
    </SceneArrival>
  </View>;
}
