import {pulpColors} from '../theme';
import React from 'react';
import {View,Text,ScrollView,Pressable} from 'react-native';
import type {Command,GameState} from '../../src/core/types';
import {getChapter} from '../../src/core/story/chapters';
import {loadSeenChapters,markChapterSeen} from '../../src/core/storage';
import {GameButton} from './Panel';
import SceneArrival from './SceneArrival';
import {artSource} from './Art';
import {font,palette} from '../theme';
import {useScreenPadding} from '../useScreenPadding';
export default function ChapterView({state,dispatch}:{state:GameState;dispatch:(c:Command)=>void}){const pad=useScreenPadding();const active=state.chapter;const chapter=active?getChapter(active.id):undefined;const [seen,setSeen]=React.useState(false);React.useEffect(()=>{let alive=true;setSeen(false);if(active)loadSeenChapters().then(s=>{if(alive)setSeen(s.includes(active.id))}).catch(()=>{});return()=>{alive=false}},[active?.id]);if(!active||!chapter)return null;const atEnd=seen||active.paragraph>=chapter.text.length-1;const close=()=>{void markChapterSeen(active.id);dispatch({type:'SkipChapter'})};return <SceneArrival source={artSource(`chapter/${chapter.id}`)??require('../../assets/scence/episode-village.jpg')} sceneKey={chapter.id}><View style={{flex:1,paddingTop:pad.top+16,paddingHorizontal:24,paddingBottom:pad.bottom+20,justifyContent:'flex-end',backgroundColor:pulpColors.storySceneShade}}><View style={{maxHeight:'62%',backgroundColor:pulpColors.storyTextShade,padding:18,gap:12}}><Text style={{fontFamily:font.display,color:palette.moon,fontSize:25}}>{chapter.title}</Text><Pressable onPress={()=>atEnd?close():dispatch({type:'AdvanceChapter'})}><ScrollView style={{maxHeight:290}}><Text style={{fontFamily:font.body,color:palette.text,fontSize:27,lineHeight:34}}>{seen?chapter.text.join('\n\n'):chapter.text[active.paragraph]}</Text></ScrollView></Pressable><Text style={{fontFamily:font.ui,color:palette.textDim,fontSize:11}}>{seen?'เคยอ่านแล้ว':`${active.paragraph+1}/${chapter.text.length}`}</Text><GameButton label={atEnd?'เดินทางต่อ':'อ่านต่อ'} tone="primary" onPress={()=>atEnd?close():dispatch({type:'AdvanceChapter'})}/>{!atEnd&&<GameButton label="ข้ามบทนี้" onPress={close}/>}</View></View></SceneArrival>;}
