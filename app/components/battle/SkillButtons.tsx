// app/components/battle/SkillButtons.tsx — slot B and C skills on the battle HUD.
// Round buttons fit the narrow HUD slot; the sheet carries the full name and text.
import React from 'react';
import { Image, View } from 'react-native';
import type { GameState } from '../../../src/core/types';
import { skillsFor } from '../../../src/core/skills';
import SkillSheet, { skillStatus } from '../SkillSheet';
import BattleSeal,{BATTLE_SEAL_ART_SIZE} from './BattleSeal';

const art:Record<string,number>={
 muay_teacher:require('../../../assets/ui/card-stance.png'),diamond_heart:require('../../../assets/ui/card-parry.png'),
 composure:require('../../../assets/ui/card-breath.png'),consecrate:require('../../../assets/ui/ritual-jar.png'),
 metta:require('../../../assets/ui/blessing-herb-object.png'),samadhi:require('../../../assets/ui/blessing-shrine-object.png'),
 ghost_strength:require('../../../assets/ui/ritual-knife.png'),possession:require('../../../assets/ui/trail-ghost.png'),
};
export default function SkillButtons({ state, enabled, onUse }: {
  state: GameState; enabled: boolean; onUse: (id: string, index?: number) => void;
}) {
  const [open, setOpen] = React.useState<string | null>(null);
  const skills = skillsFor(state.classId).filter(d => d.slot !== 'A');
  return <View testID="skill-buttons" style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
    {skills.map(d => {
      const st = skillStatus(state, d.id), cd = state.skills?.[d.id] ?? 0;
      const live = st.ready && enabled;
      return <BattleSeal key={d.id} hitSize={32} testID={`skill-${d.slot}`} label={`สกิล ${d.name} · ${st.label}`} onPress={()=>setOpen(d.id)} tone={live?'positive':'neutral'} muted={!live} count={cd>0?cd:undefined}>
        <Image accessible={false} source={art[d.id]} resizeMode="contain" style={{width:BATTLE_SEAL_ART_SIZE,height:BATTLE_SEAL_ART_SIZE}}/>
      </BattleSeal>;
    })}
    <SkillSheet state={state} id={open} onClose={() => setOpen(null)} onUse={(id, i) => enabled && onUse(id, i)} />
  </View>;
}
