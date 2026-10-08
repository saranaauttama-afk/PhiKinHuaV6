import React from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import type { OfferDisplay } from './offerDisplay';
import { artSource } from './Art';
import RitualSurface from './RitualSurface';
import { font, palette, paper } from '../theme';

const sceneArt: Record<string, number> = {
  'phi-pop': require('../../assets/ui/map-pop.png'),
  'nang-tanee': require('../../assets/ui/map-tanee.png'),
  'phi-nang-ram': require('../../assets/ui/map-dancer.png'),
  'phi-pong-kang': require('../../assets/ui/map-pongkang.png'),
};

export default function SceneGhostChoices({ choices, selected, onSelect, onEnter }: {
  choices: { display: OfferDisplay; resolved: boolean; index: number }[];
  selected: number | null; onSelect: (index: number | null) => void; onEnter: (index: number) => void;
}) {
  const [height, setHeight] = React.useState(382);
  const spriteHeight = Math.max(100, Math.min(240, height * .36));
  const picked = choices.find(c => c.index === selected && !c.resolved);
  // Keep native parents stable while selection changes opacity and transforms.
  // Fabric must not reparent the image layers when a layout-only view unflattens.
  return <View collapsable={false} onLayout={e => setHeight(e.nativeEvent.layout.height)} style={styles.scene}>
    <View collapsable={false} style={styles.figures}>
      {choices.map(({ display: d, resolved, index }) => {
        const active = selected === index && !resolved;
        const dim = !!picked && !active;
        const source = sceneArt[d.id] ?? artSource(d.artSlot);
        return <Pressable collapsable={false} key={`${d.id}-${index}`} accessibilityRole="button" accessibilityLabel={d.name}
          accessibilityState={{ selected: active, disabled: resolved }} disabled={resolved}
          onPress={() => onSelect(active ? null : index)} style={[styles.figure, { opacity: resolved ? .25 : dim ? .35 : 1 }]}>
          <RitualSurface kind="occupationPage" style={{width:'100%',padding:12,borderWidth:active?2:0,borderColor:palette.moon}}>
            <View collapsable={false} style={[styles.art,{height:spriteHeight}]}><Image accessible={false} source={source??require('../../assets/ui/trail-ghost.png')} resizeMode="contain" style={styles.sprite}/></View>
            <Text numberOfLines={2} style={{fontFamily:font.heading,fontSize:15,color:paper.ink,textAlign:'center',minHeight:44}}>{d.name}</Text>
            <Text style={{fontFamily:font.ui,fontSize:11,color:paper.red,textAlign:'center'}}>{resolved?'ผ่านแล้ว':active?'เลือกแล้ว':'ต่อสู้'}</Text>
          </RitualSurface>
        </Pressable>;
      })}
    </View>
    <View collapsable={false} style={styles.decision}>
      {picked ? <>
        <Text style={styles.description}>{picked.display.description}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="เผชิญหน้า →" onPress={() => onEnter(picked.index)} style={styles.enter}>
          <RitualSurface kind="wood" style={styles.enterWood}><Text style={styles.enterText}>เผชิญหน้า →</Text></RitualSurface>
        </Pressable>
      </> : <Text style={styles.prompt}>เลือกผีที่คุณจะเผชิญหน้า</Text>}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  scene: { flex: 1 }, figures: { flex: 1, minHeight: 150, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 24, gap: 8 },
  figure: { flex: 1, maxWidth: 240, alignItems: 'center', minHeight: 150 },
  art: { width: '100%', height: 210 }, sprite: { position: 'absolute', width: '100%', height: '100%' },
  name: { fontFamily: font.heading, fontSize: 17, textAlign: 'center', textShadowColor: palette.shadow, textShadowRadius: 4, textShadowOffset: { width: 0, height: 2 } },
  hint: { color: palette.textDim, fontFamily: font.ui, fontSize: 10, marginTop: 3 },
  decision: { minHeight: 116, justifyContent: 'center', alignItems: 'center', paddingTop: 12, paddingHorizontal: 18, gap: 8 },
  description: { color: palette.text, fontFamily: font.body, fontSize: 21, lineHeight: 24, textAlign: 'center', textShadowColor: palette.shadow, textShadowRadius: 4, textShadowOffset: { width: 0, height: 2 }, paddingHorizontal: 10, paddingVertical: 4 },
  prompt: { color: palette.textDim, fontFamily: font.ui, fontSize: 12 },
  enter: { minHeight: 48, minWidth: 190, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 0, paddingVertical: 0 },
  enterWood: { minHeight: 52, minWidth: 190, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  enterText: { color: palette.moon, fontFamily: font.heading, fontSize: 16 },
});
