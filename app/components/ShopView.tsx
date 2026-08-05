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

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { CardData, Command, GameState, ShopItem } from '../../src/core/types';
import { removeCostForCount, upgradeCostForCount } from '../../src/core/balance/economy';
import { canUpgrade, upgradeLevelOf, MAX_UPGRADE_LEVEL } from '../../src/core/engine/shared';
import FusionAltarView from './FusionAltarView';
import Panel, { GameButton } from './Panel';
import { font, palette, radius, size, space, surface, tint, layer } from '../theme';
import { useScreenPadding } from '../useScreenPadding';

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
  title, line, note, onPress, wide = false, disabled = false,
}: {
  title: string; line?: string; note?: string; onPress: () => void;
  wide?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={{
        paddingHorizontal: space.md, paddingVertical: space.sm,
        borderRadius: radius.md,
        backgroundColor: surface.panelWell,
        borderWidth: 1, borderColor: palette.line,
        minWidth: wide ? '46%' : 110,
        flexGrow: wide ? 1 : 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text style={{ color: palette.text, fontSize: size.ui, fontFamily: font.heading }}>
        {title}
      </Text>
      {!!line && (
        <Text style={{ color: palette.textDim, fontSize: size.label, marginTop: 2, fontFamily: font.ui }}>
          {line}
        </Text>
      )}
      {!!note && (
        <Text style={{ color: palette.moonDim, fontSize: size.label, marginTop: 2, fontFamily: font.uiMed }}>
          {note}
        </Text>
      )}
    </Pressable>
  );
}

/** บรรทัดบอกว่าทำไมตอนนี้ยังใช้ไม่ได้ */
function Unavailable({ text }: { text: string }) {
  return (
    <View style={{
      paddingHorizontal: space.lg, paddingVertical: space.md,
      borderRadius: radius.md,
      backgroundColor: surface.panelDim,
      borderWidth: 1, borderColor: palette.line,
    }}>
      <Text style={{
        color: palette.textFaint, textAlign: 'center',
        fontSize: size.ui, fontFamily: font.ui,
      }}>
        {text}
      </Text>
    </View>
  );
}

function Money({ state }: { state: GameState }) {
  return (
    <Text style={{
      color: palette.moonDim, fontSize: size.label,
      fontFamily: font.ui, marginBottom: space.md,
    }}>
      ทองในย่าม {state.player.gold ?? 0}
    </Text>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{
      color: palette.textDim, fontSize: size.bodyLg,
      fontFamily: font.body, lineHeight: 26, marginBottom: space.md,
    }}>
      {children}
    </Text>
  );
}

export default function ShopView({ state, dispatch }: ShopViewProps) {
  const pad = useScreenPadding();
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
            title={cardOf(item)?.name ?? 'ของไม่ทราบชนิด'}
            line={cardLine(cardOf(item))}
            note={`${item.price} ทอง`}
            onPress={() => dispatch({ type: 'TakeShop', index: i })}
          />
        ))}
      </View>
      <GameButton
        label="ขอดูของชุดใหม่ (50 ทอง)"
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
            title={equipOf(item)?.name ?? 'ของไม่ทราบชนิด'}
            line={equipOf(item)?.desc}
            note={`${item.price} ทอง · ${equipOf(item)?.rarity ?? ''}`}
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
          ค่าเผา {cost} ทอง · สละไปแล้ว {count} ใบ
        </Text>
        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          {deck.map((card, i) => (
            <ItemChip
              key={i}
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
    const count = state.runCounters?.upgradeShopCount ?? 0;
    const cost = upgradeCostForCount(count);
    return (
      <Panel title="ปลุกเสกการ์ด">
        <Lead>โต๊ะพิธีตั้งอยู่กลางลาน ธูปยังไหม้ค้าง เจ้าพิธีรอเราอยู่แล้ว</Lead>
        <Money state={state} />
        <Text style={{ color: palette.moonDim, fontSize: size.label, marginBottom: space.md, fontFamily: font.ui }}>
          ปลุกเสกไปแล้ว {count} ครั้ง · ใบหนึ่งปลุกได้ถึงขั้น {MAX_UPGRADE_LEVEL} · ราคาขึ้นตามขั้นของใบ
        </Text>
        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          {deck.map((card, i) => (
            <ItemChip
              key={i}
              title={card.name || card.id}
              line={cardLine(card)}
              // ใบที่ปลุกไปแล้วยังโชว์อยู่แต่กดไม่ได้ — ซ่อนทิ้งจะทำให้ลำดับ index
              // ที่ส่งเข้า dispatch เพี้ยนจากสำรับจริง
              note={
                canUpgrade(card)
                  ? `ขั้น ${upgradeLevelOf(card)} → ${upgradeLevelOf(card) + 1} · ${upgradeCostForCount(count + upgradeLevelOf(card))} ทอง`
                  : 'สุดขั้นแล้ว'
              }
              disabled={!canUpgrade(card)}
              onPress={() => dispatch({ type: 'ShopUpgradeBuy', index: i })}
            />
          ))}
        </View>
      </Panel>
    );
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
        <Lead>ศาลไม้เล็กๆ ใต้ต้นโพธิ์ ผ้าแพรสีซีดพลิ้วอยู่ทั้งที่ไม่มีลม</Lead>
        <Text style={{ color: palette.textDim, fontSize: size.label, marginBottom: space.md, fontFamily: font.ui }}>
          ทอง {state.player.gold ?? 0} · เลือด {state.player.hp}/{state.player.maxHp} · ใช้ได้อีก {Math.max(0, maxUses - used)} ครั้ง
        </Text>

        {canUse ? (
          <GameButton
            label={`ขอพร ${cost} ทอง (ฟื้น ${missing})`}
            tone="primary"
            onPress={() => dispatch({ type: 'UseHealingShrine' })}
          />
        ) : (
          <Unavailable
            text={
              used >= maxUses ? 'ศาลนี้หมดแรงแล้ว'
              : missing <= 0 ? 'เลือดเต็มอยู่แล้ว'
              : 'ทองไม่พอ'
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
          <GameButton
            label="ตักขึ้นมาดื่ม (ฟื้น 10 · ไม่เสียทอง)"
            tone="primary"
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
                  title={cardOf(item)?.name ?? 'ของไม่ทราบชนิด'}
                  line={cardLine(cardOf(item))}
                  note="หยิบฟรี"
                  onPress={() => dispatch({ type: 'TakeSingleTreasureCard', index: i })}
                  wide
                />
              ))}
            </View>
            <GameButton
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

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: palette.scrimHeavy,
      zIndex: layer.overlay,
    }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: pad.top, paddingBottom: pad.bottom + space.xl }}>
        {kind === 'card'            && cardShop()}
        {kind === 'equipment'       && equipmentShop()}
        {kind === 'remove'          && removeShop()}
        {kind === 'upgrade'         && upgradeShop()}
        {kind === 'healing'         && healingShrine()}
        {kind === 'well'            && well()}
        {kind === 'treasure'        && treasure()}
        {kind === 'treasure_single' && singleTreasure()}
        {kind === 'fusion'          && <FusionAltarView state={state} dispatch={dispatch} />}

        <View style={{
          marginTop: space.xl, flexDirection: 'row',
          justifyContent: 'center', gap: space.md,
        }}>
          <GameButton
            label="เดินทางต่อ ▸"
            tone="primary"
            onPress={() => dispatch({ type: 'CompleteNode' })}
          />
          {/* แท่นผสานกับเหตุการณ์ไม่ใช่ร้าน ไม่มีอะไรให้ "ลบทิ้ง" */}
          {kind !== 'fusion' && (
            <GameButton
              label="ทำลายทิ้ง"
              tone="danger"
              onPress={() => dispatch({ type: 'DeleteShop' })}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
