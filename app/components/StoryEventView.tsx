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

type Props = {
  state: GameState;
  dispatch: (cmd: Command) => void;
};

export default function StoryEventView({ state, dispatch }: Props) {
  const story = state.story;
  if (state.phase !== 'event' || !story) return null;

  const ev = getStoryEvent(story.eventId);
  if (!ev) return null;

  const decided = story.result != null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <ImageBackground
        source={require('../../assets/scence/abandonedHut.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', padding: 22, paddingTop: 60 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>

            <Text style={{
              color: '#ffd88a', fontSize: 22, fontFamily: 'Prompt_700Bold',
              textAlign: 'center',
            }}>
              {ev.title}
            </Text>

            <View style={{ alignItems: 'center', marginVertical: 14 }}>
              <Art slot={`event/${ev.id}`} width={220} />
            </View>

            {/* เนื้อเรื่อง — ให้ที่เยอะและเว้นบรรทัดกว้าง เพราะคนต้องอ่านจริง */}
            <Text style={{
              color: 'rgba(255,255,255,0.92)', fontSize: 16, lineHeight: 28,
              fontFamily: 'Prompt_400Regular',
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
                        backgroundColor: locked ? 'rgba(0,0,0,0.35)' : 'rgba(40,28,18,0.85)',
                        borderWidth: 1,
                        borderColor: locked ? 'rgba(255,255,255,0.12)' : 'rgba(255,216,138,0.45)',
                        opacity: locked ? 0.55 : 1,
                      }}
                    >
                      <Text style={{
                        color: locked ? 'rgba(255,255,255,0.5)' : 'white',
                        fontSize: 15, fontFamily: 'Prompt_600SemiBold',
                      }}>
                        {c.label}
                      </Text>
                      {/* บอกเหตุผลที่กดไม่ได้เสมอ — ทางที่เทาโดยไม่บอกอะไรคือทางที่กวนใจเปล่าๆ */}
                      {!!locked && (
                        <Text style={{ color: '#fca5a5', fontSize: 12, marginTop: 4 }}>
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
                  backgroundColor: 'rgba(255,216,138,0.1)',
                  borderWidth: 1, borderColor: 'rgba(255,216,138,0.35)',
                }}>
                  <Text style={{
                    color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 26,
                    fontFamily: 'Prompt_400Regular',
                  }}>
                    {story.result}
                  </Text>
                </View>

                <Pressable
                  onPress={() => dispatch({ type: 'CompleteNode' })}
                  style={{
                    marginTop: 18, alignSelf: 'center',
                    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14,
                    backgroundColor: 'rgba(255,216,138,0.25)',
                    borderWidth: 1, borderColor: 'rgba(255,216,138,0.6)',
                  }}
                >
                  <Text style={{ color: '#ffd88a', fontSize: 15, fontFamily: 'Prompt_600SemiBold' }}>
                    เดินทางต่อ ▸
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}
