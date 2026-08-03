// app/components/ChapterView.tsx — หน้าคั่นเล่าเรื่อง
//
// อ่านแบบ visual novel: แตะทีละย่อหน้า ย่อหน้าเก่าจางลงแต่ยังอยู่ให้ย้อนอ่านได้
// เทเนื้อเรื่องทั้งก้อนใส่ทีเดียวคือวิธีที่ทำให้คนกดข้ามโดยไม่อ่านสักตัว
//
// สองอย่างที่ต้องมีเสมอ:
//   - ปุ่มข้าม — คนเล่นรอบที่สิบไม่ควรถูกจับอ่านบทเปิดเรื่องเดิมอีก
//   - บทที่เคยอ่านจบแล้ว (จำข้ามรันใน settings) กางทั้งบทมาเลยตั้งแต่แรก
//     ไม่ต้องแตะไล่ทีละย่อหน้าซ้ำ

import React, { useEffect, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, Text, View } from 'react-native';
import type { Command, GameState } from '../../src/core/types';
import { getChapter } from '../../src/core/story/chapters';
import { loadSeenChapters, markChapterSeen } from '../../src/core/storage';
import Art from './Art';
import { GameButton, Scrim } from './Panel';
import { font, palette, size, space } from '../theme';

type Props = {
  state: GameState;
  dispatch: (cmd: Command) => void;
};

export default function ChapterView({ state, dispatch }: Props) {
  const active = state.chapter;
  const chapter = active ? getChapter(active.id) : undefined;

  /** บทนี้เคยอ่านจบแล้วในรันก่อนๆ ไหม — `null` แปลว่ายังอ่าน settings ไม่เสร็จ */
  const [readBefore, setReadBefore] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    if (!active) return;
    setReadBefore(null);
    loadSeenChapters()
      .then(seen => { if (alive) setReadBefore(seen.includes(active.id)); })
      .catch(() => { if (alive) setReadBefore(false); });
    return () => { alive = false; };
  }, [active?.id]);

  if (!active || !chapter) return null;

  // ยังไม่รู้ว่าเคยอ่านหรือยัง — รอก่อนหนึ่งเฟรม ดีกว่ากางทั้งบทให้คนที่ยังไม่เคยอ่าน
  const showAll = readBefore === true;
  const shown = showAll
    ? chapter.text
    : chapter.text.slice(0, active.paragraph + 1);
  const atEnd = showAll || active.paragraph >= chapter.text.length - 1;

  const close = () => {
    void markChapterSeen(active.id);
    dispatch({ type: 'SkipChapter' });
  };

  const tap = () => {
    if (showAll || atEnd) { close(); return; }
    dispatch({ type: 'AdvanceChapter' });
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/scence/swamp.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        {/* ม่านทึบสุด — บทคั่นคือช่วงที่ทุกอย่างอื่นควรเงียบ */}
        <View style={{ flex: 1, backgroundColor: palette.scrimFull }}>
          <Pressable style={{ flex: 1 }} onPress={tap}>
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                paddingHorizontal: space.xl,
                paddingVertical: space.xxl,
              }}
            >
              {/* ช่องรูปของบท — ยังไม่มีไฟล์ก็ได้กรอบบอกโจทย์ภาพแทน */}
              <Art
                slot={`chapter/${chapter.id}`}
                height={168}
                style={{ alignSelf: 'stretch', marginBottom: space.xl }}
              />

              <Text style={{
                color: palette.moon, fontSize: size.display,
                fontFamily: font.display, textAlign: 'center',
              }}>
                {chapter.title}
              </Text>

              <View style={{
                height: 1, backgroundColor: palette.line,
                marginTop: space.md, marginBottom: space.xl,
              }} />

              {shown.map((para, i) => (
                <Text
                  key={i}
                  style={{
                    color: palette.text,
                    // ย่อหน้าเก่าจางลง สายตาจึงรู้เองว่าอ่านถึงไหน
                    opacity: showAll || i === active.paragraph ? 1 : 0.5,
                    fontSize: size.bodyLg + 3,
                    fontFamily: font.body,
                    lineHeight: 34,
                    marginBottom: space.lg,
                  }}
                >
                  {para}
                </Text>
              ))}
            </ScrollView>
          </Pressable>

          <View style={{
            flexDirection: 'row', justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: space.xl, paddingBottom: space.xxl,
          }}>
            <Text style={{
              color: palette.textFaint, fontSize: size.label, fontFamily: font.ui,
            }}>
              {showAll
                ? 'เคยอ่านแล้ว'
                : `${active.paragraph + 1}/${chapter.text.length} · แตะเพื่ออ่านต่อ`}
            </Text>

            <GameButton
              label={atEnd ? 'เดินทางต่อ' : 'ข้ามบทนี้'}
              tone={atEnd ? 'primary' : 'normal'}
              onPress={close}
            />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}
