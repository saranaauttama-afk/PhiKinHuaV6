import React from 'react';
import { View, Text, Pressable, ScrollView, ImageBackground } from 'react-native';
import { ALL_CLASS_IDS, CHARACTER_CLASSES, type ClassId } from '../../src/core/classes';
import Art from './Art';

/**
 * หน้าเลือกคลาสก่อนเริ่มรัน
 *
 * เดิมเกมมีผู้เล่นแบบเดียว เด็คตั้งต้นชุดเดียว เล่นรอบสองได้ประสบการณ์เกือบเหมือนเดิม
 * คลาสคือสิ่งที่ทำให้เล่นซ้ำแล้วเกมเปลี่ยน — เด็คคนละแบบ ค่าสถานะคนละแบบ
 * และพรติดตัวที่เปลี่ยนวิธีเล่นทั้งรัน
 */

type Props = {
  onPick: (id: ClassId) => void;
  onBack?: () => void;
};

export default function ClassSelectScreen({ onPick, onBack }: Props) {
  const [selected, setSelected] = React.useState<ClassId | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/scence/swamp.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', paddingTop: 56, paddingHorizontal: 20 }}>
          <Text style={{
            color: 'white', fontSize: 24, textAlign: 'center',
            fontFamily: 'Prompt_700Bold',
          }}>
            เลือกผู้เดินทาง
          </Text>
          <Text style={{
            color: 'rgba(255,255,255,0.6)', fontSize: 14,
            textAlign: 'center', marginTop: 4, marginBottom: 18,
          }}>
            แต่ละคนถือสำรับและวิชาคนละอย่าง
          </Text>

          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
            {ALL_CLASS_IDS.map(id => {
              const c = CHARACTER_CLASSES[id];
              const isOn = selected === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setSelected(id)}
                  style={{
                    padding: 16, borderRadius: 16,
                    backgroundColor: isOn ? 'rgba(40,28,18,0.92)' : 'rgba(0,0,0,0.5)',
                    borderWidth: isOn ? 2 : 1,
                    borderColor: isOn ? 'rgba(255,216,138,0.75)' : 'rgba(255,255,255,0.18)',
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* ยังไม่มีภาพตัวละคร — <Art> วาง placeholder พร้อมโจทย์ภาพไว้ให้ */}
                    <Art slot={`class/${id}`} width={72} compact />

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                        <Text style={{ color: '#ffd88a', fontSize: 19, fontFamily: 'Prompt_700Bold' }}>
                          {c.name}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                          {c.title}
                        </Text>
                      </View>

                      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 6 }}>
                        {c.desc}
                      </Text>

                      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                        <Stat label="พลังชีวิต" value={`${c.startHp}`} />
                        <Stat label="พลังงาน" value={`${c.startEnergy}`} />
                        <Stat label="ขนาดมือ" value={`${c.startHandSize}`} />
                      </View>
                    </View>
                  </View>

                  {isOn && (
                    <View style={{
                      marginTop: 12, paddingTop: 10,
                      borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)',
                    }}>
                      <Text style={{ color: '#ffd88a', fontSize: 14, fontFamily: 'Prompt_600SemiBold' }}>
                        {c.passiveName}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
                        {c.passiveDesc}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ paddingVertical: 14, gap: 10 }}>
            <Pressable
              onPress={() => selected && onPick(selected)}
              disabled={!selected}
              style={{
                alignSelf: 'center',
                paddingHorizontal: 34, paddingVertical: 12, borderRadius: 14,
                opacity: selected ? 1 : 0.4,
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderWidth: 1, borderColor: 'rgba(255,216,138,0.5)',
              }}
            >
              <Text style={{ color: '#ffd88a', fontSize: 16, fontFamily: 'Prompt_600SemiBold' }}>
                {selected ? 'ออกเดินทาง' : 'เลือกผู้เดินทางก่อน'}
              </Text>
            </Pressable>

            {onBack && (
              <Pressable onPress={onBack} style={{ alignSelf: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>◂ ย้อนกลับ</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{label}</Text>
      <Text style={{ color: 'white', fontSize: 15, fontFamily: 'ChakraPetch_700Bold' }}>{value}</Text>
    </View>
  );
}
