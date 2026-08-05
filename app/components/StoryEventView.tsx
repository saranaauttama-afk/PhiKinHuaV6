// app/components/StoryEventView.tsx — หน้าเหตุการณ์ระหว่างทาง
//
// ต่างจากหน้าร้านตรงที่ตัวเอกของหน้านี้คือ **ข้อความ** ไม่ใช่ปุ่ม
// ผู้เล่นอ่านสิ่งที่เห็น เลือกว่าจะทำอะไร แล้วอ่านว่าเกิดอะไรขึ้น
// เลย์เอาต์จึงให้ที่กับตัวหนังสือเป็นหลัก และให้ทางเลือกเป็นบรรทัดยาวอ่านง่าย
// ไม่ใช่ปุ่มเล็กๆ เรียงกัน

import React from 'react';
import { ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import type { Command, GameState } from '../../src/core/types';
import { getStoryEvent, choiceLocked } from '../../src/core/events/story';
import Art from './Art';
import Panel, { GameButton, Scrim } from './Panel';
import { font, palette, radius, size, space, surface, tint, layer } from '../theme';
import { useScreenPadding } from '../useScreenPadding';

type Props = {
  state: GameState;
  dispatch: (cmd: Command) => void;
};

export default function StoryEventView({ state, dispatch }: Props) {
  const pad = useScreenPadding();
  const story = state.story;
  if (state.phase !== 'event' || !story) return null;

  const ev = getStoryEvent(story.eventId);
  if (!ev) return null;

  const decided = story.result != null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: layer.overlay }}>
      <ImageBackground
        source={require('../../assets/scence/abandonedHut.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <Scrim heavy style={{ padding: space.xl, paddingTop: pad.top }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>

            <Text style={{
              color: palette.moon, fontSize: size.display, fontFamily: font.display,
              textAlign: 'center',
            }}>
              {ev.title}
            </Text>

            <View style={{ alignItems: 'center', marginVertical: 14 }}>
              <Art slot={`event/${ev.id}`} width={220} />
            </View>

            {/* เนื้อเรื่อง — ให้ที่เยอะและเว้นบรรทัดกว้าง เพราะคนต้องอ่านจริง */}
            <Text style={{
              color: palette.text, fontSize: size.bodyLg, lineHeight: 30,
              fontFamily: font.body,
            }}>
              {ev.text}
            </Text>

            {!decided && (
              <View style={{ marginTop: 22, gap: 10 }}>
                {ev.choices.map((c, i) => {
                  const locked = choiceLocked(state, c);
                  return (
                    <Pressable
                      key={i}
                      onPress={() => !locked && dispatch({ type: 'ChooseEventOption', index: i })}
                      disabled={!!locked}
                      style={{
                        padding: 14, borderRadius: 14,
                        backgroundColor: locked ? surface.panelDim : surface.panelRaise,
                        borderWidth: 1,
                        borderColor: locked ? palette.line : palette.lineStrong,
                        opacity: locked ? 0.55 : 1,
                      }}
                    >
                      <Text style={{
                        color: locked ? palette.textFaint : palette.text,
                        fontSize: size.heading, fontFamily: font.heading,
                      }}>
                        {c.label}
                      </Text>
                      {/* บอกเหตุผลที่กดไม่ได้เสมอ — ทางที่เทาโดยไม่บอกอะไรคือทางที่กวนใจเปล่าๆ */}
                      {!!locked && (
                        <Text style={{ color: palette.blood, fontSize: size.label, marginTop: 4, fontFamily: font.ui }}>
                          {locked}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {decided && (
              <View style={{ marginTop: 20 }}>
                <View style={{
                  padding: 16, borderRadius: 14,
                  backgroundColor: tint.moonFaint,
                  borderWidth: 1, borderColor: palette.lineStrong,
                }}>
                  <Text style={{
                    color: palette.text, fontSize: size.bodyLg, lineHeight: 28,
                    fontFamily: font.body,
                  }}>
                    {story.result}
                  </Text>
                </View>

                <GameButton
                  label="เดินทางต่อ ▸"
                  tone="primary"
                  onPress={() => dispatch({ type: 'CompleteNode' })}
                  style={{ marginTop: space.lg, alignSelf: 'center' }}
                />
              </View>
            )}
          </ScrollView>
        </Scrim>
      </ImageBackground>
    </View>
  );
}
