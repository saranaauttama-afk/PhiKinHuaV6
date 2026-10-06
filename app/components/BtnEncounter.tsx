import React from 'react';
import {Pressable,Text,View} from 'react-native';
import Art from './Art';
import {paper} from './Paper';
import RitualSurface from './RitualSurface';
import InkIcon from './InkIcon';
import {GameButton} from './Panel';
import {font} from '../theme';
interface Props{encounter:{id:string;type:string;name:string;description:string;artSlot:string};height?:number;onPress?:()=>void;onEnter?:()=>void;onClose?:()=>void;showButtons?:boolean}
export default function BtnEncounter({encounter,height=264,onPress,onEnter,onClose,showButtons}:Props){const fight=encounter.type==='monster'||encounter.type==='boss';return <Pressable accessibilityRole="button" onPress={onPress} accessibilityLabel={encounter.name} style={{width:height*.56}}><RitualSurface kind="notice" style={{width:height*.56,minHeight:height,paddingHorizontal:14,paddingTop:14,paddingBottom:36,gap:8,borderWidth:0,borderColor:paper.red}}><View style={{flexDirection:'row',gap:4,alignItems:'center',justifyContent:'center'}}><Text numberOfLines={2} style={{color:paper.ink,fontFamily:font.heading,fontSize:15,textAlign:'center',flexShrink:1}}>{encounter.name}</Text></View>{!showButtons&&<Text style={{color:paper.ink,fontFamily:font.ui,fontSize:10,textAlign:'center'}}>แตะเพื่อเลือก ›</Text>}<Art slot={encounter.artSlot} width={height*.46} height={height*.43} style={{alignSelf:'center'}}/><Text numberOfLines={3} style={{fontFamily:font.body,color:paper.ink,fontSize:19,lineHeight:22,alignSelf:'stretch'}}>{encounter.description}</Text>{showButtons?<><GameButton label={fight?'จับผี':'แวะที่นี่'} onPress={onEnter} tone="primary" style={{alignSelf:'stretch'}}/>{!fight&&<GameButton label="ข้าม" onPress={onClose}/>}</>:null}</RitualSurface></Pressable>;}
