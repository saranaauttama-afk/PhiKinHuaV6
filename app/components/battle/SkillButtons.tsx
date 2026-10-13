// app/components/battle/SkillButtons.tsx — slot B and C skills on the battle HUD.
// Round buttons fit the narrow HUD slot; the sheet carries the full name and text.
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { GameState } from '../../../src/core/types';
import { skillsFor } from '../../../src/core/skills';
import SkillSheet, { skillStatus } from '../SkillSheet';
import { font, palette, tint } from '../../theme';

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
      return <Pressable key={d.id} testID={`skill-${d.slot}`} accessibilityRole="button"
        accessibilityLabel={`สกิล ${d.name} · ${st.label}`} onPress={() => setOpen(d.id)}
        style={{ width: 44, height: 44, borderRadius: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
          borderColor: live ? palette.moon : palette.line, backgroundColor: live ? tint.moonSoft : palette.scrim }}>
        <Image accessible={false} source={art[d.id]} resizeMode="contain" style={{width:30,height:30,opacity:live?1:.5}}/><Text style={{position:'absolute',bottom:0,right:2,fontSize:9,color:palette.moon}}>{live?'✓':cd>0?'':'×'}</Text>
        {cd > 0 && <View style={{ position: 'absolute', right: -4, top: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: palette.bloodDeep, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: font.ui, fontSize: 10, color: palette.text }}>{cd}</Text>
        </View>}
      </Pressable>;
    })}
    <SkillSheet state={state} id={open} onClose={() => setOpen(null)} onUse={(id, i) => enabled && onUse(id, i)} />
  </View>;
}
