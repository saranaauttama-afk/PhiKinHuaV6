import {pulpColors} from '../theme';
import React from 'react';
import {View,Text,ImageBackground,ActivityIndicator} from 'react-native';
import {font,palette} from '../theme';
export default function LoadingScreen(){return <ImageBackground source={require('../../assets/scence/menu-haunted.jpg')} style={{flex:1}}><View style={{flex:1,backgroundColor:pulpColors.loadingShade,justifyContent:'flex-end',alignItems:'center',paddingBottom:90,gap:12}}><Text style={{fontFamily:font.display,color:palette.moon,fontSize:42}}>ผีกินหัว</Text><ActivityIndicator color={palette.moon}/><Text style={{fontFamily:font.ui,color:palette.text,fontSize:13}}>กำลังเปิดเรื่องราว…</Text></View></ImageBackground>;}
