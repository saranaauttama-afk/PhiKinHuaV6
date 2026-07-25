// app/components/JourneyTrail.tsx — แถบเส้นทางทั้งรัน
//
// แผนที่เดิมเป็นถาด 3 ช่องที่สุ่มตัวเองใหม่ทุกครั้งที่เคลียร์ ผู้เล่นจึงไม่มีทาง
// รู้เลยว่าเดินมาไกลแค่ไหน เหลืออีกกี่ไฟต์ หรือบอสอยู่ตรงไหน
//
// แถบนี้แสดงเส้นทางทั้งเส้นตั้งแต่ต้นจนถึงบอสสุดท้าย ตำแหน่งที่ยืนอยู่ตอนนี้
// และชั้นที่ผ่านมาแล้ว — เลื่อนตามตำแหน่งผู้เล่นให้อัตโนมัติ

import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { GameState } from '../../src/core/types';

const TILE_W = 34;
const TILE_GAP = 6;

type RowKind = 'fight' | 'boss' | 'rest';

function kindOfRow(state: GameState, rowIdx: number): { kind: RowKind; fightIndex?: number } {
  const plan = state.journey?.plans[rowIdx];
  if (!plan) return { kind: 'rest' };
  if (plan.kind === 'rest') return { kind: 'rest' };
  if (plan.kind === 'boss') return { kind: 'boss', fightIndex: plan.fightIndex };
  return { kind: 'fight', fightIndex: plan.fightIndex };
}

const ICON: Record<RowKind, string> = { fight: '⚔', boss: '☠', rest: '⛺' };

export default function JourneyTrail({ state }: { state: GameState }) {
  const journey = state.journey;
  const scroller = React.useRef<ScrollView>(null);

  // ชั้นที่กำลังจะเลือกอยู่ตอนนี้ — ยังไม่ออกเดินทางคือชั้น 0
  const choosingRow = journey?.currentId
    ? (journey.nodes[journey.currentId]?.row ?? 0) + 1
    : 0;

  React.useEffect(() => {
    if (!journey) return;
    const x = Math.max(0, (choosingRow - 2) * (TILE_W + TILE_GAP));
    scroller.current?.scrollTo({ x, animated: true });
  }, [journey, choosingRow]);

  if (!journey) return null;

  const totalRows = journey.rows.length;
  const fightRows = journey.plans.filter(p => p.kind !== 'rest').length;
  const fightsDone = journey.plans
    .slice(0, Math.min(choosingRow, totalRows))
    .filter(p => p.kind !== 'rest').length;

  return (
    <View style={{ paddingHorizontal: 12 }}>
      <Text style={{
        color: 'rgba(255,255,255,0.75)', fontSize: 12,
        fontFamily: 'Prompt_600SemiBold', marginBottom: 6,
      }}>
        เส้นทาง · ศึกที่ {Math.min(fightsDone + 1, fightRows)}/{fightRows}
      </Text>

      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: TILE_GAP, paddingVertical: 4, alignItems: 'center' }}
      >
        {journey.rows.map((_row, i) => {
          const { kind, fightIndex } = kindOfRow(state, i);
          const past    = i < choosingRow;
          const current = i === choosingRow;

          const accent =
            kind === 'boss' ? '#f87171'
            : kind === 'fight' ? '#fbbf24'
            : '#4ade80';

          return (
            <View key={i} style={{ alignItems: 'center', width: TILE_W }}>
              <View style={{
                width: TILE_W, height: TILE_W, borderRadius: TILE_W / 2,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: current ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.45)',
                borderWidth: current ? 2 : 1,
                borderColor: current ? accent : 'rgba(255,255,255,0.2)',
                opacity: past ? 0.35 : 1,
              }}>
                <Text style={{ fontSize: kind === 'boss' ? 17 : 15, color: accent }}>
                  {past ? '✓' : ICON[kind]}
                </Text>
              </View>

              <Text style={{
                color: 'rgba(255,255,255,0.55)', fontSize: 9, marginTop: 2,
                fontFamily: 'ChakraPetch_400Regular',
              }}>
                {fightIndex ?? ''}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
