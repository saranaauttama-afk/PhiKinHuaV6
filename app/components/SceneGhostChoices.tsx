import React from 'react';
import {TheaterContext} from './paper/SceneTheater';
import GhostArt from './GhostArt';
import {characterPlacement} from '../../src/visual/paperEnvironments';
import {paperPlacement} from '../../src/visual/paperPlacement';
import {useBattleLayout} from './battle/battleLayout';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import type { OfferDisplay } from './offerDisplay';
import {encounterAction} from '../encounterPresentation';
import CandleSelection from './CandleSelection';
import GhostLoreButton from './GhostLoreButton';
import { artSource } from './Art';
import RitualSurface from './RitualSurface';
import { font, palette } from '../theme';
import {QuietButton} from './QuietChrome';


export default function SceneGhostChoices({ choices, selected, onSelect, onEnter }: {
  choices: { display: OfferDisplay; resolved: boolean; index: number }[];
  selected: number | null; onSelect: (index: number | null) => void; onEnter: (index: number) => void;
}) {
  const theater=React.useContext(TheaterContext),layout=useBattleLayout(),safe=useSafeAreaInsets();
  const root=React.useRef<View>(null),[originY,setOriginY]=React.useState(0);
  const [height, setHeight] = React.useState(382);
  const spriteHeight = Math.max(120, Math.min(330, height - 190));
  const picked = choices.find(c => c.index === selected && !c.resolved);
  // Keep native parents stable while selection changes opacity and transforms.
  // Fabric must not reparent the image layers when a layout-only view unflattens.
  return <View collapsable={false} ref={root} onLayout={e => {setHeight(e.nativeEvent.layout.height);root.current?.measureInWindow((x,y)=>setOriginY(y));}} style={styles.scene}>
    <View collapsable={false} style={styles.figures}>
      {choices.map(({ display: d, resolved, index }) => {
        const active = selected === index && !resolved;
        const dim = !!picked && !active;
        const source = artSource(d.artSlot);
        const contact=theater&&d.isCombat?paperPlacement(layout.screenW,layout.screenH,safe.top,safe.bottom,characterPlacement(theater.sceneId,d.id),layout.hudTop-8):null;
        const localHeight=contact?Math.max(70,contact.groundY-originY-24):spriteHeight;
        const floatingGap=contact?contact.groundY-contact.footY:0;
        const actorWidth=Math.min(240,(layout.screenW-48)/Math.max(1,choices.length));
        return <Pressable collapsable={false} key={`${d.id}-${index}`} accessibilityRole="button" accessibilityLabel={d.name}
          accessibilityState={{ selected: active, disabled: resolved }} disabled={resolved}
          onPress={() => onSelect(active ? null : index)} style={[styles.figure, { opacity: resolved ? .25 : dim ? .35 : 1 }]}>
          <View collapsable={false} style={[styles.art,{height:localHeight,transform:[{translateY:active?-3:0}]}]}>{contact?<><View style={{position:'absolute',bottom:0,left:'25%',right:'25%',height:contact.mode==='floating'?7:4,borderRadius:100,backgroundColor:palette.shadow,opacity:contact.shadow.opacity}}/><View style={{position:'absolute',bottom:floatingGap,alignSelf:'center'}}><GhostArt id={d.id} width={actorWidth} height={Math.max(40,localHeight-floatingGap)} fadeDuration={0}/></View></>:<Image accessible={false} source={source??require('../../assets/ui/trail-ghost.png')} resizeMode="contain" style={styles.sprite}/>}</View>
          <Text numberOfLines={2} style={[styles.name,{color:active?palette.moon:palette.text}]}>{d.name}</Text>
          {d.isCombat&&<GhostLoreButton id={d.id}/>}<Text style={styles.hint}>{resolved?'ผ่านแล้ว':active?'เลือกแล้ว':d.isCombat?'ต่อสู้':d.type.startsWith('shop_')?'ร้านค้า':'จุดพัก'}</Text>
        </Pressable>;
      })}
    </View>
    <View collapsable={false} style={styles.decision}>
      {picked ? <>
        <Text style={styles.description}>{picked.display.description}</Text>
        <QuietButton label={encounterAction(picked.display)} primary onPress={()=>onEnter(picked.index)} style={{minWidth:190}}/>
      </> : <Text style={styles.prompt}>เลือกทางที่จะไปต่อ</Text>}
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
