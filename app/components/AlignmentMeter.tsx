// app/components/AlignmentMeter.tsx — ความกล้า / บุญ as two rows of pips, 0–6, threshold marked.
import React from 'react';
import { Text, View } from 'react-native';
import type { CampaignRun } from '../../src/core/campaign/nights';
import { ALIGNMENT } from '../../src/core/balance/notfm';
import { alignmentBoss } from '../../src/core/campaign/alignment';
import { ULTIMATE_BOSS } from '../../src/core/campaign/bosses';
import { font, palette, paper, tint } from '../theme';

/** Who waits on night 3 if the run ended its dialogues now. */
export function finalBossHint(campaign?: Partial<CampaignRun>): string | undefined {
  if (!campaign) return undefined;
  const boss = alignmentBoss({ campaign: campaign as CampaignRun }, campaign.difficulty !== 5);
  const fixed = !!campaign.finalBossId;
  const name = boss.id === ULTIMATE_BOSS.id ? 'ผีที่ไม่มีใครกลับมาเล่าได้' : boss.name;
  return `${fixed ? 'ผีคืนที่สาม' : 'ถ้าคืนที่สามมาถึงตอนนี้'}: ${name}`;
}

function Row({ label, value, color, testID, ink }: { label: string; value: number; color: string; testID: string; ink?: boolean }) {
  return (
    <View testID={testID} accessible accessibilityLabel={`${label} ${value} จาก ${ALIGNMENT.max}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ fontFamily: font.ui, color: ink ? paper.muted : palette.textDim, fontSize: 12, width: 54 }}>{label}</Text>
      {Array.from({ length: ALIGNMENT.max }, (_, i) => (
        <View key={i} style={{
          width: 12, height: 12, borderRadius: 6, borderWidth: 1,
          borderColor: i === ALIGNMENT.threshold - 1 ? (ink ? paper.ink : palette.moon) : (ink ? paper.line : palette.line),
          backgroundColor: i < value ? color : ink ? paper.light : tint.moonFaint,
        }} />
      ))}
      <Text style={{ fontFamily: font.ui, color: ink ? paper.ink : palette.text, fontSize: 12 }}>{value}</Text>
    </View>
  );
}

export default function AlignmentMeter({ campaign, compact, ink }: { campaign?: Partial<CampaignRun>; compact?: boolean; ink?: boolean }) {
  if (!campaign) return null;
  const hint = finalBossHint(campaign);
  return (
    <View style={{ gap: compact ? 3 : 6, alignItems: 'center' }}>
      <Row testID="meter-courage" label="ความกล้า" value={campaign.courage ?? 0} color={ink ? paper.red : palette.bloodLit} ink={ink} />
      <Row testID="meter-merit" label="บุญ" value={campaign.merit ?? 0} color={ink ? paper.ink : palette.moon} ink={ink} />
      {!compact && <Text style={{ fontFamily: font.ui, color: ink ? paper.muted : palette.textFaint, fontSize: 11, textAlign: 'center' }}>
        ถึง {ALIGNMENT.threshold} ได้พร · ค่าทั้งสองเลือกผีคืนที่สาม
      </Text>}
      {!compact && hint && <Text testID="final-boss-hint" style={{ fontFamily: font.ui, color: ink ? paper.ink : palette.moonDim, fontSize: 12, textAlign: 'center' }}>{hint}</Text>}
    </View>
  );
}
