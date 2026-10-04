import {pulpColors} from '../theme';
import React from 'react';
import {View,Text,ScrollView,Pressable} from 'react-native';
import type {Command,GameState} from '../../src/core/types';
import {getStoryEvent,choiceLocked} from '../../src/core/events/story';
import {artSource} from './Art';
import SceneArrival from './SceneArrival';
import Paper,{paper} from './Paper';
import InkIcon from './InkIcon';
import {GameButton} from './Panel';
import {font,palette,layer} from '../theme';
import {useScreenPadding} from '../useScreenPadding';
export default function StoryEventView({state,dispatch}:{state:GameState;dispatch:(c:Command)=>void}){const pad=useScreenPadding();const story=state.story;if(state.phase!=='event'||!story)return null;const ev=getStoryEvent(story.eventId);if(!ev)return null;const decided=story.result!=null;return <View style={{position:'absolute',inset:0,zIndex:layer.overlay}}><SceneArrival source={artSource(`event/${ev.id}`)??require('../../assets/scence/lantern-hut.jpg')} sceneKey={ev.id}><ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'flex-end',padding:20,paddingTop:pad.top+20,paddingBottom:pad.bottom+20}}><View style={{backgroundColor:pulpColors.eventTextShade,padding:16,marginTop:180,marginBottom:16}}><Text style={{fontFamily:font.display,color:palette.moon,fontSize:26,marginBottom:10}}>{ev.title}</Text><Text style={{fontFamily:font.body,color:palette.text,fontSize:27,lineHeight:32}}>{ev.text}</Text></View>{!decided?<View style={{gap:10}}>{ev.choices.map((c,i)=>{const locked=choiceLocked(state,c);const parts=c.label.split(' · ');return <Pressable key={i} accessibilityRole="button" disabled={!!locked} onPress={()=>dispatch({type:'ChooseEventOption',index:i})} style={({pressed})=>({opacity:locked?.5:1,transform:[{translateY:pressed?2:0}]})}><Paper style={{flexDirection:'row',gap:12,alignItems:'center',padding:14}}><InkIcon name={i===0?'rest':i===1?'gold':'walk'} size={32} color={paper.red}/><View style={{flex:1}}><Text style={{fontFamily:font.heading,color:paper.ink,fontSize:15}}>{parts[0]}</Text>{parts.length>1&&<Text style={{fontFamily:font.ui,color:paper.muted,fontSize:12,lineHeight:19,marginTop:4}}>{parts.slice(1).join(' · ')}</Text>}{locked&&<Text style={{fontFamily:font.ui,color:paper.red,fontSize:12}}>{locked}</Text>}</View></Paper></Pressable>})}</View>:<Paper style={{gap:14}}><Text style={{fontFamily:font.body,color:paper.ink,fontSize:25,lineHeight:30}}>{story.result}</Text><GameButton label="เดินทางต่อ" tone="primary" onPress={()=>dispatch({type:'CompleteNode'})}/></Paper>}</ScrollView></SceneArrival></View>;}
