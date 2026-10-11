import {pulpColors} from '../theme';
import React from 'react';
import {View,Text,Image,ImageBackground,ActivityIndicator} from 'react-native';
import {font,palette} from '../theme';
export default function LoadingScreen(){return <ImageBackground source={require('../../assets/scence/menu-haunted.jpg')} style={{flex:1}}><View style={{flex:1,backgroundColor:pulpColors.loadingShade,justifyContent:'flex-end',alignItems:'center',paddingBottom:90,gap:12}}><Image accessible accessibilityLabel="ผีกินหัว" source={require('../../assets/ui/title-pulp.png')} resizeMode="contain" style={{width:'80%',maxWidth:340,height:144}}/><View style={{flexDirection:'row',gap:12}}>{[1,2,3,4,5].map(n=><View key={n} style={{width:8,height:8,borderRadius:4,backgroundColor:palette.moon,opacity:n===1?1:.25}}/>)}</View><ActivityIndicator color={palette.moon}/><Text style={{fontFamily:font.ui,color:palette.text,fontSize:13}}>กำลังเปิดเรื่องราว…</Text></View></ImageBackground>;}
