import React from 'react';
import {View,Text,ScrollView,Pressable,Image} from 'react-native';
import type {Command,GameState} from '../../src/core/types';
import {getStoryEvent,choiceLocked} from '../../src/core/events/story';
import {visitedScene} from '../scenePresentation';
import SceneArrival from './SceneArrival';
import RitualSurface from './RitualSurface';
import CandleSelection from './CandleSelection';
import {QuietButton} from './QuietChrome';
import {font,palette,quietUiColors} from '../theme';
import {useScreenPadding} from '../useScreenPadding';

export default function StoryEventView({state,dispatch}:{state:GameState;dispatch:(c:Command)=>void}) {
  const pad=useScreenPadding();const story=state.story;const [selected,setSelected]=React.useState<number|null>(null);const [choiceHeight,setChoiceHeight]=React.useState(128);
  React.useEffect(()=>setSelected(null),[story?.eventId]);
  if(state.phase!=='event'||!story)return null;
  const ev=getStoryEvent(story.eventId);if(!ev)return null;
  const decided=story.result!=null;const location=visitedScene(state);
  return <View style={{flex:1}}>
    <SceneArrival instant source={location.source} sceneKey={location.key}>
      <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'flex-end',paddingHorizontal:16,paddingTop:pad.top+240,paddingBottom:pad.bottom+20}}>
        <RitualSurface kind="quietSlate" style={{paddingHorizontal:18,paddingVertical:20,gap:14}}>
          <Text accessibilityRole="header" style={{fontFamily:font.heading,color:palette.moon,fontSize:24}}>{ev.title}</Text>
          <Text style={{fontFamily:font.ui,color:palette.text,fontSize:14,lineHeight:24}}>{decided?story.result:ev.text}</Text>
          {decided?<QuietButton label="กลับจุดพัก" primary onPress={()=>dispatch({type:'CompleteNode'})}/>
          :<View style={{gap:10}}>{ev.choices.map((c,i)=>{
            const locked=choiceLocked(state,c);const parts=c.label.split(/ [·•] /);
            const image=i===0?require('../../assets/ui/trail-rest.png'):i===1?require('../../assets/ui/blessing-amulet.png'):require('../../assets/ui/card-stance.png');
            return <Pressable key={i} testID={`event-choice-${i}`} accessibilityRole="button" accessibilityLabel={c.label} accessibilityState={{disabled:!!locked}}
              disabled={!!locked} onPress={()=>setSelected(i)} style={({pressed})=>({opacity:locked?.5:pressed?.85:1})}>
              <CandleSelection selected={selected===i} dim={selected!==null&&selected!==i}><RitualSurface kind="quietSlate" style={{minHeight:choiceHeight,flexDirection:'row',gap:12,alignItems:'center',paddingHorizontal:18,paddingVertical:12}}>
                <Image accessible={false} source={image} resizeMode="contain" style={{width:42,height:50}}/>
                <View onLayout={e=>setChoiceHeight(h=>Math.max(h,e.nativeEvent.layout.height+24))} style={{flex:1}}>
                  <Text style={{fontFamily:font.heading,color:palette.moon,fontSize:15,lineHeight:23}}>{parts[0]}</Text>
                  {parts.length>1&&<Text style={{fontFamily:font.ui,color:c.branches?palette.bloodLit:palette.text,fontSize:13,lineHeight:21,marginTop:3}}>{parts.slice(1).join(' · ')}</Text>}
                  {locked&&<Text style={{fontFamily:font.ui,color:palette.bloodLit,fontSize:12,lineHeight:20}}>{locked}</Text>}
                </View>
              </RitualSurface></CandleSelection>
            </Pressable>;
          })}<QuietButton label={selected===null?'เลือกสิ่งที่จะทำ':`ยืนยัน · ${ev.choices[selected]?.label.split(/ [·•] /)[0]}`} primary disabled={selected===null||!!choiceLocked(state,ev.choices[selected])} onPress={()=>{if(selected!==null&&!choiceLocked(state,ev.choices[selected]))dispatch({type:'ChooseEventOption',index:selected});}}/></View>}
        </RitualSurface>
      </ScrollView>
    </SceneArrival>
  </View>;
}
