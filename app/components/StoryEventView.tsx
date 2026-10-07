import React from 'react';
import {View,Text,ScrollView,Pressable,Image} from 'react-native';
import type {Command,GameState} from '../../src/core/types';
import {getStoryEvent,choiceLocked} from '../../src/core/events/story';
import {artSource} from './Art';
import SceneArrival from './SceneArrival';
import RitualSurface from './RitualSurface';
import {GameButton} from './Panel';
import {font,palette} from '../theme';
import {useScreenPadding} from '../useScreenPadding';

export default function StoryEventView({state,dispatch}:{state:GameState;dispatch:(c:Command)=>void}) {
  const pad=useScreenPadding();const story=state.story;
  if(state.phase!=='event'||!story)return null;
  const ev=getStoryEvent(story.eventId);if(!ev)return null;
  const decided=story.result!=null;
  return <View style={{flex:1}}>
    <SceneArrival source={artSource(`event/${ev.id}`)??require('../../assets/scence/lantern-hut.jpg')} sceneKey={ev.id}>
      <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'flex-end',paddingHorizontal:16,paddingTop:pad.top+140,paddingBottom:pad.bottom+20}}>
        <RitualSurface kind="darkCloth" style={{paddingHorizontal:22,paddingVertical:24,gap:14}}>
          <Text accessibilityRole="header" style={{fontFamily:font.heading,color:palette.moon,fontSize:24}}>{ev.title}</Text>
          <Text style={{fontFamily:font.ui,color:palette.text,fontSize:15,lineHeight:26}}>{decided?story.result:ev.text}</Text>
          {decided?<GameButton label="เดินทางต่อ" tone="primary" onPress={()=>dispatch({type:'CompleteNode'})}/>
          :<View style={{gap:10}}>{ev.choices.map((c,i)=>{
            const locked=choiceLocked(state,c);const parts=c.label.split(/ [·•] /);
            const image=i===0?require('../../assets/ui/trail-rest.png'):i===1?require('../../assets/ui/blessing-amulet.png'):require('../../assets/ui/card-stance.png');
            return <Pressable key={i} accessibilityRole="button" accessibilityLabel={c.label} accessibilityState={{disabled:!!locked}}
              disabled={!!locked} onPress={()=>dispatch({type:'ChooseEventOption',index:i})} style={({pressed})=>({opacity:locked?.5:pressed?.85:1})}>
              <RitualSurface kind="wood" style={{flexDirection:'row',gap:12,alignItems:'center',paddingHorizontal:18,paddingVertical:16,minHeight:86}}>
                <Image accessible={false} source={image} resizeMode="contain" style={{width:42,height:50}}/>
                <View style={{flex:1}}>
                  <Text style={{fontFamily:font.heading,color:palette.moon,fontSize:15,lineHeight:23}}>{parts[0]}</Text>
                  {parts.length>1&&<Text style={{fontFamily:font.ui,color:c.branches?palette.bloodLit:palette.text,fontSize:13,lineHeight:21,marginTop:3}}>{parts.slice(1).join(' · ')}</Text>}
                  {locked&&<Text style={{fontFamily:font.ui,color:palette.bloodLit,fontSize:12,lineHeight:20}}>{locked}</Text>}
                </View>
              </RitualSurface>
            </Pressable>;
          })}</View>}
        </RitualSurface>
      </ScrollView>
    </SceneArrival>
  </View>;
}
