import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Art from './Art';
import { font, palette, surface, space } from '../theme';
interface Props {
  encounter: { id: string; type: string; name: string; description: string; artSlot: string };
  height?: number;
  onPress?: () => void;
  onEnter?: () => void;
  onClose?: () => void;
  showButtons?: boolean;
}
export default function BtnEncounter({ encounter, height = 264, onPress, onEnter, onClose, showButtons }: Props) {
  const fight = encounter.type === 'monster' || encounter.type === 'boss';
  return (
    <Pressable onPress={onPress} style={{ width: height * 0.56, minHeight: height, borderWidth: 3, borderColor: showButtons ? palette.moon : palette.ink, backgroundColor: surface.panel, padding: 8, gap: 6 }}>
      <Text numberOfLines={2} style={{ minHeight: 36, color: palette.moon, fontSize: 13, fontFamily: font.heading, textAlign: 'center' }}>{encounter.name}</Text>
      <Art slot={encounter.artSlot} width={height * 0.46} height={height * 0.39} />
      <Text numberOfLines={3} style={{ color: palette.text, fontSize: 12, fontFamily: font.ui, lineHeight: 18, flex: 1 }}>{encounter.description}</Text>
      {showButtons ? <>
        <Pressable accessibilityRole="button" onPress={onEnter} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.paperDeep, borderWidth: 2, borderColor: palette.moon }}>
          <Text style={{ color: palette.text, fontFamily: font.heading, fontSize: 14 }}>{fight ? 'จับผี' : 'แวะที่นี่'}</Text>
        </Pressable>
        {!fight && <Pressable accessibilityRole="button" onPress={onClose} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: palette.textDim, fontFamily: font.ui }}>ข้าม</Text></Pressable>}
      </> : <Text style={{ color: palette.textDim, fontFamily: font.ui, fontSize: 11, paddingVertical: space.xs }}>แตะเพื่อเลือก</Text>}
    </Pressable>
  );
}
