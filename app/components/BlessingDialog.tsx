import React from 'react';
import { View, ImageBackground, Modal, Pressable, Dimensions, Text, Image } from 'react-native';
interface BlessingDialogProps {
  visible: boolean;
  onClose: () => void;
  onReceiveBlessing?: (blessingId: string) => void;
  children?: React.ReactNode;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BlessingDialog({ visible, onClose, onReceiveBlessing, children }: BlessingDialogProps) {
  const [selectedBlessing, setSelectedBlessing] = React.useState<string | null>(null);
  return (
<Modal
  visible={visible}
  transparent
  animationType="fade"
  statusBarTranslucent
  onRequestClose={onClose}
>
  <View
    style={{
      flex: 1,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <View
      style={{
        width: screenWidth * 0.8,
        height: screenHeight * 0.6,
      }}
    >
      {/* รูป bgBlessing เป็น base */}
      <Image
        source={require('../../assets/images/bgBlessing.png')}
        style={{ 
          position: 'absolute',
          width: '100%', 
          height: '100%',
          top: 0,
          left: 0,
        }}
        resizeMode="cover"
      />

      {/* Container สำหรับปุ่ม Close - ขวาบน */}
      <View style={{ 
        position: 'absolute',
        top: '35%',
        right: 10,
        padding: 0,
      }}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Image
            source={require('../../assets/images/btnCloseMini.png')}
            style={{ width: 40, height: 40 }}
            resizeMode="stretch"
          />
        </Pressable>
      </View>

      {/* Container สำหรับ Blessing Options - กลาง */}
      <View style={{ 
        position: 'absolute',
        top: '45%',
        width: '100%',
        alignItems: 'center',
        transform: [{ translateY: -30 }],
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          width: '80%',
        }}>
          {/* ปุ่ม Blessing ซ้าย */}
          <Pressable
            onPress={() => setSelectedBlessing('regen_1')}
          >
            <ImageBackground
              source={require('../../assets/images/btnBlessing.png')}
              style={{ 
                width: 100, 
                height: 150, 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingVertical: 8,
                opacity: !selectedBlessing || selectedBlessing === 'regen_1' ? 1.0 : 0.4,
              }}
              resizeMode="stretch"
            >
              
              {/* รูป regen_1 ตรงกลาง */}
              <Image
                source={require('../../assets/imgBlessing/regen_1.png')}
                style={{
                  width: 75,
                  height: 75,
                  top:10
                }}
                resizeMode="contain"
              />
              
              {/* ข้อความบน */}
              <Text
                style={{
                  color: 'white',
                  fontSize: 8,
                  fontFamily: 'ChakraPetch_600SemiBold',
                  textAlign: 'center',
                  top:-35,
                  opacity:0.7
                }}
              >
                พลังฟื้นฟู
              </Text>
            </ImageBackground>
          </Pressable>

          {/* ปุ่ม Blessing ขวา */}
          <Pressable
            onPress={() => setSelectedBlessing('start_block_3')}
          >
            <ImageBackground
              source={require('../../assets/images/btnBlessing.png')}
              style={{ 
                width: 100, 
                height: 150, 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingVertical: 8,
                opacity: !selectedBlessing || selectedBlessing === 'start_block_3' ? 1.0 : 0.4,
              }}
              resizeMode="stretch"
            >
              
              
              {/* รูป start_block_3 ตรงกลาง */}
              <Image
                source={require('../../assets/imgBlessing/start_block_3.png')}
                style={{
                  width: 75,
                  height: 75,
                  top:10
                }}
                resizeMode="contain"
              />
              
              {/* ข้อความบน */}
              <Text
                style={{
                  color: 'white',
                  fontSize: 8,
                  fontFamily: 'ChakraPetch_600SemiBold',
                  textAlign: 'center',
                  top:-35,
                  opacity:0.7
                }}
              >
                เสื้อยันต์โบราณ
              </Text>
            </ImageBackground>
          </Pressable>
        </View>
      </View>

      {/* Container สำหรับปุ่มรับพร - ล่างกลาง */}
      <View style={{ 
        position: 'absolute',
        bottom: 0,
        width: '100%',
        alignItems: 'center',
        paddingBottom: 60,
      }}>
        <Pressable
          onPress={() => {
            if (selectedBlessing && onReceiveBlessing) {
              onReceiveBlessing(selectedBlessing);
            } else {
              onClose();
            }
          }}
          disabled={!selectedBlessing}
        >
          <ImageBackground
            source={require('../../assets/images/btnBg.png')}
            style={{ 
              width: 160, 
              height: 80, 
              justifyContent: 'center', 
              alignItems: 'center',
              opacity: !selectedBlessing ? 0.4 : 1.0,
            }}
            resizeMode="stretch"
          >
            <Text
              style={{
                color: 'white',
                fontSize: 14,
                opacity:0.6,
                fontFamily: 'ChakraPetch_400Regular',
                textAlign: 'center',
              }}
            >
              รับพรจ้ะ
            </Text>
          </ImageBackground>
        </Pressable>
      </View>
    </View>
  </View>
</Modal>

  );
}