import React from 'react';
import {Image, Pressable, ScrollView, Text, View, useWindowDimensions} from 'react-native';
import type {PageOffer} from '../../src/core/map/pages';
import {describeOffer} from './offerDisplay';
import RitualSurface from './RitualSurface';
import {font, palette, paper} from '../theme';

/** Objects belong to the scene; one tap enters the destination. */
export default function RestDestinations({offers,resolved,onEnter,children}:{
  offers:(PageOffer|undefined)[]; resolved:boolean[]; onEnter:(offer:PageOffer,index:number)=>void; children?:React.ReactNode;
}) {
  const {width}=useWindowDimensions();
  const [rowWidth,setRowWidth]=React.useState(width-32);
  const total=offers.filter(Boolean).length;
  const destinationWidth=Math.min(260,total===1?rowWidth:Math.floor((rowWidth-10*(total-1))/total));
  return <View style={{flex:1,justifyContent:'center',paddingHorizontal:16,paddingVertical:10,gap:16}}>
    <View onLayout={e=>setRowWidth(e.nativeEvent.layout.width)} style={{flexDirection:'row',flexWrap:'nowrap',justifyContent:'center',gap:10}}>
      {offers.map((offer,index)=>{
        if(!offer)return null;
        const d=describeOffer(offer,index);
        const done=resolved[index]??false;
        const image=offer.kind==='healing_shrine'||offer.kind==='well'
          ?require('../../assets/ui/blessing-shrine-object.png')
          :offer.kind==='shop_upgrade'||offer.kind==='fusion_altar'
          ?require('../../assets/ui/ritual-knife.png')
          :offer.kind==='story_event'&&offer.eventId==='episode_blessing'?require('../../assets/ui/ritual-jar.png')
          :offer.kind==='story_event'?require('../../assets/ui/trail-rest.png')
          :offer.kind==='shop_equipment'?require('../../assets/ui/blessing-amulet.png')
          :require('../../assets/ui/ritual-jar.png');
        return <Pressable key={d.id} disabled={done} accessibilityRole="button" accessibilityLabel={d.name} accessibilityState={{disabled:done}} accessibilityHint={done?undefined:'เข้าสถานที่นี้ทันที'}
          onPress={()=>onEnter(offer,index)} style={({pressed})=>({width:destinationWidth,opacity:done?.45:pressed?.85:1})}>
          <RitualSurface kind="quietSlate" style={{paddingHorizontal:8,paddingVertical:12,minHeight:112,justifyContent:'center'}}>
            <Image accessible={false} source={image} resizeMode="contain" style={{height:total>2?90:120,width:'100%',marginBottom:8}}/><Text style={{fontFamily:font.heading,fontSize:total>2?14:17,color:palette.moon,textAlign:'center'}}>{d.name}</Text>
            <Text style={{fontFamily:font.ui,fontSize:13,lineHeight:21,color:palette.moon,textAlign:'center',marginTop:4}}>{done?'แวะแล้ว':d.description}</Text>
          </RitualSurface>
        </Pressable>;
      })}
    </View>
    {children}
  </View>;
}
