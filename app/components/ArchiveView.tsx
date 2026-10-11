import React from 'react';
import {BackHandler,FlatList,Image,ImageBackground,Modal,Pressable,ScrollView,Text,TextInput,View,useWindowDimensions} from 'react-native';
import {useArchive} from '../../src/store/archiveStore';
import {archiveProgress,type ArchiveProfile,type Discovery} from '../../src/core/archive/progress';
import {archiveCards,CARD_GROUPS,CORE_CARD_IDS,GHOST_CATALOG,GHOST_GROUPS,type ArchiveCard} from '../../src/core/archive/catalog';
import {cardById} from '../../src/core/pack';
import {upgradeCard} from '../../src/core/engine/shared';
import {CardFace} from './DeckCard';
import GhostArt from './GhostArt';
import RitualSurface from './RitualSurface';
import {QuietButton,QuietHeader} from './QuietChrome';
import {font,palette,paper,archiveColors} from '../theme';
import {useScreenPadding} from '../useScreenPadding';

type Ghost=typeof GHOST_CATALOG[number];
type Entry={id:string;name:string;group:string;ghost?:Ghost;card?:ArchiveCard;progress?:Discovery};
type Row={key:string;group:string;items?:Entry[];count?:number};
const modes=[['progress','บันทึกการพบ'],['all','ดูทั้งหมด'],['seen','พบแล้ว'],['unseen','ยังไม่พบ']] as const;
const typeOptions=[['','ทุกประเภท'],['attack','โจมตี'],['skill','วิชา'],['trap','กับดัก'],['equipment','เครื่องราง'],['curse','คำสาป']];
const rarityOptions=[['','ทุกความหายาก'],['Common','ปกติ'],['Uncommon','ไม่ธรรมดา'],['Rare','หายาก'],['Legendary','ตำนาน']];
const sortOptions=[['catalog','ลำดับสารานุกรม'],['name','ชื่อ ก–ฮ'],['seen','พบแล้วก่อน']];
const copy={fontFamily:font.ui,color:palette.text,fontSize:13,lineHeight:22};
/** Fixture profile is supplied only by web QA; game entry always reads durable progress. */
export default function ArchiveView({onClose,fixture}:{onClose:()=>void;fixture?:ArchiveProfile}){
 const store=useArchive(),pad=useScreenPadding(),{width}=useWindowDimensions();
 const profile=fixture??store.profile,ready=!!fixture||store.ready,error=fixture?'':store.error;
 const progress=React.useMemo(()=>archiveProgress(profile),[profile]);
 const catalog=React.useMemo(()=>archiveCards(progress.cardData),[progress]);
 const [tab,setTab]=React.useState<'ghosts'|'cards'>('ghosts'),[mode,setMode]=React.useState('progress'),[group,setGroup]=React.useState(''),[query,setQuery]=React.useState(''),[type,setType]=React.useState(''),[rarity,setRarity]=React.useState(''),[sort,setSort]=React.useState('catalog');
 const [filter,setFilter]=React.useState<'group'|'type'|'rarity'|'sort'|null>(null),[detail,setDetail]=React.useState<Entry|null>(null),[upgraded,setUpgraded]=React.useState(false);
 const list=React.useRef<FlatList<Row>>(null);
 React.useEffect(()=>{if(!fixture)void store.hydrate().catch(()=>{});},[fixture]);
 const closeOverlay=()=>{if(detail)setDetail(null);else if(filter)setFilter(null);else onClose();};
 React.useEffect(()=>{const sub=BackHandler.addEventListener('hardwareBackPress',()=>{closeOverlay();return true;});return()=>sub.remove();},[detail,filter,onClose]);
 const all:Entry[]=tab==='ghosts'?GHOST_CATALOG.map(ghost=>({id:ghost.id,name:ghost.name,group:ghost.group,ghost,progress:progress.ghosts[ghost.id]})):catalog.map(card=>({id:card.card.id,name:card.card.name??card.card.id,group:card.group,card,progress:progress.cards[card.card.id]}));
 const filtered=all.filter(e=>{
  const seen=!!e.progress;if(group&&e.group!==group)return false;
  if((mode==='seen'&&!seen)||(mode==='unseen'&&seen))return false;
  if(tab==='cards'&&((type&&e.card?.card.type!==type)||(rarity&&e.card?.card.rarity!==rarity)))return false;
  if(query.trim()){if(mode==='progress'&&!seen)return false;const search=e.name+' '+(e.ghost?.description??e.card?.card.desc??'');return search.toLocaleLowerCase('th').includes(query.trim().toLocaleLowerCase('th'));}
  return true;
 });
 const groups=tab==='ghosts'?GHOST_GROUPS:CARD_GROUPS;
 const columns=tab==='ghosts'?3:2,rows:Row[]=[];
 for(const g of groups){const items=filtered.filter(e=>e.group===g);if(sort==='name')items.sort((a,b)=>a.name.localeCompare(b.name,'th'));if(sort==='seen')items.sort((a,b)=>Number(!!b.progress)-Number(!!a.progress));if(!items.length)continue;
  rows.push({key:g,group:g,count:items.length});for(let i=0;i<items.length;i+=columns)rows.push({key:g+'-'+i,group:g,items:items.slice(i,i+columns)});
 }
 const isLocked=(e:Entry)=>mode==='progress'&&!e.progress;
 const changeTab=(next:'ghosts'|'cards')=>{setTab(next);setGroup('');setType('');setRarity('');setQuery('');setDetail(null);list.current?.scrollToOffset({offset:0,animated:false});};
 const options=filter==='group'?[['','ทุกกลุ่ม'],...groups.filter(g=>all.some(e=>e.group===g)).map(g=>[g,g])]:filter==='type'?typeOptions:filter==='rarity'?rarityOptions:sortOptions;
 const chosen=filter==='group'?group:filter==='type'?type:filter==='rarity'?rarity:sort;
 const choose=(value:string)=>{if(filter==='group')setGroup(value);else if(filter==='type')setType(value);else if(filter==='rarity')setRarity(value);else setSort(value);setFilter(null);list.current?.scrollToOffset({offset:0,animated:false});};
 let detailCard=detail?.card?JSON.parse(JSON.stringify(detail.card.card)):undefined;
 if(detailCard&&upgraded&&detailCard.type!=='curse'&&detail?.card?.group!=='ทดสอบ')detailCard=upgradeCard(detailCard);
 const tileWidth=(Math.min(width,600)-40-8*(columns-1))/columns;
 const seenGhosts=Object.keys(progress.ghosts).length,wonGhosts=Object.values(progress.ghosts).filter(g=>g.won>0).length,seenCards=Object.keys(progress.cards).filter(id=>CORE_CARD_IDS.has(id)).length;
 const chip=(label:string,onPress:()=>void,selected=false)=><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected}} onPress={onPress} style={{minHeight:44,justifyContent:'center',paddingHorizontal:10,borderBottomWidth:selected?2:0,borderColor:palette.moon}}><Text style={[copy,{color:selected?palette.moon:palette.textDim,fontFamily:selected?font.heading:font.ui}]}>{label}</Text></Pressable>;
 return <ImageBackground source={require('../../assets/scence/menu-haunted.jpg')} style={{flex:1}}>
  <View style={{flex:1,paddingTop:pad.top,backgroundColor:archiveColors.scene}}>
   <QuietHeader title="บันทึกอาถรรพ์" subtitle="สารานุกรมผีและวิชาที่พบระหว่างทาง" onClose={onClose} closeLabel="กลับ"/>
   <View style={{width:'100%',maxWidth:600,alignSelf:'center',paddingHorizontal:20}}>
    <View style={{flexDirection:'row',gap:10}}>{(['ghosts','cards'] as const).map(t=><Pressable key={t} accessibilityRole="button" accessibilityLabel={t==='ghosts'?'ผี':'การ์ด'} accessibilityState={{selected:tab===t}} onPress={()=>changeTab(t)} style={{flex:1}}><RitualSurface kind={tab===t?'hudPaper':'quietSlate'} style={{minHeight:48,alignItems:'center'}}><Text style={{fontFamily:font.heading,fontSize:18,color:tab===t?paper.ink:palette.moon}}>{t==='ghosts'?'ผี':'การ์ด'}</Text></RitualSurface></Pressable>)}</View>
    <Text style={{fontFamily:font.heading,color:palette.moon,fontSize:22,marginTop:12}}>{tab==='ghosts'?'สารานุกรมผี':'คลังการ์ด'}</Text>
    <Text testID="archive-summary" style={copy}>{tab==='ghosts'?'พบแล้ว '+seenGhosts+' / '+GHOST_CATALOG.length+' ตัว · ปราบแล้ว '+wonGhosts+' ตัว':'การ์ดหลัก '+seenCards+' / '+CORE_CARD_IDS.size+' ใบ · หมวดพิเศษแยกด้านล่าง'}</Text>
    {!ready&&<Text style={copy}>กำลังอ่านบันทึก…</Text>}
    {!!error&&<View><Text accessibilityRole="alert" style={copy}>{error}</Text><QuietButton label="ลองบันทึกอาถรรพ์อีกครั้ง" onPress={()=>void store.retry().catch(()=>{})}/></View>}
    <TextInput accessibilityLabel="ค้นหาชื่อหรือความสามารถ" value={query} onChangeText={setQuery} placeholder="ค้นหาชื่อหรือความสามารถ…" placeholderTextColor={palette.textDim} style={{...copy,minHeight:44,paddingHorizontal:12,marginTop:10,backgroundColor:archiveColors.field,borderColor:archiveColors.fieldEdge,borderWidth:1}}/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:4}}>{modes.map(([v,label])=><React.Fragment key={v}>{chip(label,()=>{setMode(v);list.current?.scrollToOffset({offset:0,animated:false});},mode===v)}</React.Fragment>)}</ScrollView>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:4}}>{chip(group||'ทุกกลุ่ม',()=>setFilter('group'))}{tab==='cards'&&<>{chip(typeOptions.find(o=>o[0]===type)![1],()=>setFilter('type'))}{chip(rarityOptions.find(o=>o[0]===rarity)![1],()=>setFilter('rarity'))}</>}{chip(sortOptions.find(o=>o[0]===sort)![1],()=>setFilter('sort'))}</ScrollView>
   </View>
   <FlatList ref={list} testID="archive-list" data={rows} keyExtractor={r=>r.key} style={{flex:1}} contentContainerStyle={{width:'100%',maxWidth:600,alignSelf:'center',paddingHorizontal:20,paddingBottom:pad.bottom+24}} initialNumToRender={8} windowSize={5}
    ListEmptyComponent={<Text style={[copy,{paddingVertical:30,textAlign:'center'}]}>ไม่พบรายการที่ตรงกับตัวกรอง</Text>}
    ListFooterComponent={<Text style={[copy,{marginTop:18,color:palette.textDim}]}>พบ/ปราบ นับหนึ่งครั้งต่อชนิดต่อการเดินทาง{'\n'}ดูทั้งหมดไม่เพิ่มสถิติ · ปลุกเสกไม่นับเป็นการ์ดชนิดใหม่{'\n'}หลัก 126 · คำสาป 4 · สูตรผสาน 12 · ทดสอบ 1</Text>}
    renderItem={({item:r})=>!r.items?<View style={{marginTop:18,paddingBottom:9,borderBottomWidth:1,borderColor:archiveColors.rule}}><Text accessibilityRole="header" style={{fontFamily:font.heading,color:palette.moon,fontSize:17}}>{r.group} · {r.count}</Text></View>:<View style={{flexDirection:'row',gap:8,alignItems:'flex-start',paddingVertical:10}}>{r.items.map(e=><Pressable key={e.id} testID={'archive-entry-'+e.id} accessibilityRole="button" accessibilityLabel={isLocked(e)?'รายการที่ยังไม่พบ '+(all.findIndex(a=>a.id===e.id)+1):'ดู'+(e.ghost?'ผี':'การ์ด')+' '+e.name} onPress={()=>{setDetail(e);setUpgraded(false);}} style={{width:tileWidth}}>
     {e.ghost?<View style={{alignItems:'center'}}><GhostArt id={e.id} width={tileWidth} height={160} silhouette={isLocked(e)}/><Text style={{fontFamily:font.heading,fontSize:13,color:palette.moon,textAlign:'center',marginTop:8}}>{isLocked(e)?'ยังไม่พบ':e.name}</Text><Text style={[copy,{fontSize:11,textAlign:'center',color:e.progress?.won?palette.moon:palette.textDim}]}>{isLocked(e)?'???':e.progress?.won?'ปราบแล้ว':e.progress?'พบแล้ว':'ยังไม่พบ'}</Text><Text style={[copy,{fontSize:10,color:palette.textDim}]}>ลำดับ {String(all.findIndex(a=>a.id===e.id)+1).padStart(3,'0')}</Text></View>
     :isLocked(e)?<RitualSurface kind="occupationPage" style={{minHeight:220,alignItems:'center',justifyContent:'center'}}><Image source={require('../../assets/ui/trail-ghost.png')} style={{width:60,height:80,tintColor:archiveColors.muted,opacity:.5}} resizeMode="contain"/><Text style={{fontFamily:font.heading,color:paper.ink,marginTop:14}}>ยังไม่พบ</Text><Text style={{color:paper.ink}}>???</Text></RitualSurface>:<><CardFace card={e.card!.card}/><Text style={[copy,{fontSize:11,textAlign:'center',color:palette.textDim}]}>{e.progress?'เคยได้รับแล้ว':'ยังไม่เคยได้รับ'}</Text></>}
    </Pressable>)}</View>}/>
  </View>
  <Modal visible={!!filter||!!detail} transparent animationType="fade" onRequestClose={closeOverlay}>
   <View style={{flex:1,backgroundColor:archiveColors.scrim,justifyContent:'center',paddingTop:pad.top+12,paddingBottom:pad.bottom+12,paddingHorizontal:20}}>
    <View accessibilityViewIsModal style={{maxHeight:'100%',width:'100%',maxWidth:520,alignSelf:'center',backgroundColor:archiveColors.panel,borderColor:archiveColors.edge,borderWidth:1,padding:16}}>
     <QuietButton label={filter?'ปิดตัวกรอง':'ปิดรายละเอียด'} onPress={closeOverlay}/>
     <ScrollView contentContainerStyle={{paddingTop:12,paddingBottom:20,gap:10}}>
      {filter?options.map(([value,label])=><QuietButton key={value} label={label} primary={chosen===value} onPress={()=>choose(value)}/>):detail&&<>
       {isLocked(detail)?<><Text style={{fontFamily:font.heading,color:palette.moon,fontSize:24}}>ยังไม่พบ</Text><Text style={copy}>พบระหว่างเดินทางเพื่อเปิดบันทึก หรือเลือก “ดูทั้งหมด” เพื่อตรวจชื่อ ภาพ และความสามารถ</Text><QuietButton label="ดูรายการทั้งหมด" primary onPress={()=>{setMode('all');setDetail(null);}}/></>:<>
        {detail.ghost?<View style={{alignItems:'center'}}><GhostArt id={detail.id} width={Math.min(width-100,260)} height={260}/></View>:detailCard&&<CardFace card={detailCard}/>}
        <Text style={{fontFamily:font.heading,color:palette.moon,fontSize:24}}>{detail.name}</Text><Text style={copy}>{detail.group}{detail.ghost?.night?' · คืนที่ '+detail.ghost.night:''}</Text>
        {detail.ghost&&<><Text style={copy}>HP พื้นฐาน {detail.ghost.hp} · พลังจริงเพิ่มตามคืน</Text><Text style={copy}>{detail.ghost.description}</Text></>}
        {detail.card&&<><Text style={copy}>{rarityOptions.find(o=>o[0]===detail.card!.card.rarity)?.[1]??'การ์ดพิเศษ'} · {typeOptions.find(o=>o[0]===detail.card!.card.type)?.[1]??detail.card.card.type}</Text>{detail.card.group!=='ทดสอบ'&&detail.card.card.type!=='curse'&&<QuietButton label={upgraded?'ดูการ์ดขั้นปกติ':'ดูการ์ดปลุกเสกขั้น 1'} onPress={()=>setUpgraded(!upgraded)}/>} {!!detail.card.pair&&<Text style={copy}>คู่ผสาน: {detail.card.pair.map(id=>cardById(id)?.name??id).join(' + ')}</Text>}</>}
        <RitualSurface kind="occupationPage" style={{gap:7}}><Text style={{fontFamily:font.heading,color:paper.ink,fontSize:18}}>บันทึกการพบ</Text><Text style={{fontFamily:font.ui,color:paper.ink,fontSize:13,lineHeight:22}}>{detail.progress?'พบครั้งแรก คืน '+detail.progress.firstNight+' · ล่าสุด คืน '+detail.progress.lastNight+'\n'+(detail.ghost?'พบ '+detail.progress.seen+' การเดินทาง · ปราบ '+detail.progress.won+' การเดินทาง':'ได้รับใน '+detail.progress.seen+' การเดินทาง'):'ยังไม่พบ · เปิดอ่านได้จากโหมดดูทั้งหมด'}</Text></RitualSurface>
       </>}
      </>}
     </ScrollView>
    </View>
   </View>
  </Modal>
 </ImageBackground>;
}
