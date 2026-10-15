import {fightBadges} from '../src/core/combat/fightBadges';
import {rageStartTurn} from '../src/core/campaign/nights';
import {RAGE} from '../src/core/balance/notfm';
import {ghostLore} from '../src/core/monsters/folklore';
import {battleScene} from './scenePresentation';
import BattleBackdrop from './components/battle/BattleBackdrop';
import {useBattleLayout} from './components/battle/battleLayout';
import React from 'react';
import { View, ImageBackground, Pressable, Image, Text, Modal, BackHandler, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useGame } from '../src/store/gameStore';
import type { CombatEvent, CombatFrame, CardHistoryEntry } from '../src/core/types';

import { combatFrame } from '../src/core/combat/damage';
import MonsterArea, { MonsterAreaHandle } from './components/battle/MonsterArea';
import PlayerHand from './components/battle/PlayerHand';
import PlayerHUD from './components/battle/PlayerHUD';
import BlessingSeals from './components/battle/BlessingSeals';
import EnemyHandCard from './components/battle/EnemyHandCard';
import MinionRow from './components/battle/MinionRow';
import CardHistory from './components/battle/CardHistory';
import DamagePopup from './components/battle/DamagePopup';
import StatGainPopup from './components/battle/StatGainPopup';
import PrayerWaitPicker from './components/battle/PrayerWaitPicker';
import SkillButtons from './components/battle/SkillButtons';
import VictoryOverlay from './components/battle/VictoryOverlay';
import {needsVictoryIntro} from './postBattleFlow';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import DefeatOverlay from './components/battle/DefeatOverlay';
import LevelUpOverlay from './components/battle/LevelUpOverlay';
import GhostTalkOverlay from './components/battle/GhostTalkOverlay';
import {playSfx,setBeds} from '../src/audio/audio';
import {BOSS_INTRO} from '../src/audio/manifest';
import {cuesFor} from '../src/audio/cues';
import TurnEndDiscard from './components/battle/TurnEndDiscard';
import { retainLimit, turnEndExcess } from '../src/core/engine/handlers/combat';
import { bossRule } from '../src/core/campaign/bossRules';

function bossRelicView(s: import('../src/core/types').GameState) {
  const r = s.fight?.relic, rule = bossRule(r?.bossId);
  if (!r || !rule || r.bossId !== s.enemy?.id) return undefined;
  return { name: rule.relic, durability: Math.max(0, r.durability), text: rule.text, flavor: rule.flavor, broken: r.broken, stolen: r.stolen.length };
}
import CardRewardOverlay from './components/battle/CardRewardOverlay';
import PileView, { type PileId } from './components/battle/PileView';
import StatusStrip, {type BattleBadge} from './components/battle/StatusStrip';
import BlessingView from './components/BlessingView';
import { useCombatTimeline } from './components/battle/useCombatTimeline';
import ScreenFlash, { ScreenFlashHandle } from './components/battle/ScreenFlash';
import { useAppFonts } from './useAppFonts';
import { palette, surface, tint, layer, font } from './theme';

import Settings from './components/Settings';
import StartPage from './components/StartPage';
import RitualSurface from './components/RitualSurface';
import CloseSeal from './components/CloseSeal';
import {QuietButton} from './components/QuietChrome';
import {baseNewState} from '../src/core/commands';
import {fxText} from '../src/core/cards/describe';


type Phase = 'player' | 'enemy';

/** key ที่ไม่ซ้ำสำหรับ popup ของแต่ละ event */
let _popupSeq = 0;
const eventKey = (_ev: CombatEvent) => `${++_popupSeq}`;

type EnemyHandCardData = {
  key: string;
  card: { id?: string; ownerId?:string; name: string; damage: number; block: number; cost?: number; hits?: number; desc?: string };
  cardIndex: number;
  totalCards: number;
  delay: number;
  playing: boolean;
};

export default function BattlePage() {
  const router    = useRouter();
  const safe = useSafeAreaInsets();
  const battleLayout=useBattleLayout();
  const navigation = useNavigation();
  const [paused,setPaused]=React.useState(false);
  const [settingsOpen,setSettingsOpen]=React.useState(false);
  const [mainMenu,setMainMenu]=React.useState(false);
  const [saving,setSaving]=React.useState(false);
  const [saveError,setSaveError]=React.useState('');
  const allowLeave=React.useRef(false);
  const [celebratedFight,setCelebratedFight] = React.useState(-1);
  const gameState = useGame((s) => s.state);
  const dispatch  = useGame((s) => s.dispatch);
  React.useEffect(()=>{useGame.getState().setPlayPaused(paused||mainMenu);return ()=>useGame.getState().setPlayPaused(false);},[paused,mainMenu]);
  const { monsterId, monsterName } = useLocalSearchParams();
  // หน้านี้ใช้ฟอนต์เหมือนหน้าอื่นแต่เดิมไม่เคยโหลดเอง — รอดมาเพราะปกติผู้เล่น
  // เดินผ่านหน้าแผนที่ก่อนเสมอ แต่ expo-router เปิดตรงเข้าหน้านี้ได้
  const [fontsLoaded] = useAppFonts();

  const [presentation, setPresentation] = React.useState<CombatFrame | null>(null);
  const player = presentation?.player ?? gameState.player;
  const enemy = presentation?.enemy ?? gameState.enemy;
  // Face-down ghost cards keep their places while the ghost plays: a played card leaves a gap
  // instead of the rest sliding together (playtest 13 Oct). `remaining` maps hand index → slot.
  const handSlotsRef = React.useRef<{ total: number; remaining: number[] }>({ total: 0, remaining: [] });
  const heldCount = enemy?.handCount ?? 0;
  if (heldCount !== handSlotsRef.current.remaining.length) handSlotsRef.current = { total: heldCount, remaining: Array.from({ length: heldCount }, (_, i) => i) };
  const bootstrapped = React.useRef(false);
  const turnLocked = React.useRef(false);

  const [phase, setPhase] = React.useState<Phase>('player');

  const [hoveredCardId,  setHoveredCardId]  = React.useState<string | null>(null);
  const [playedCardIds,  setPlayedCardIds]  = React.useState<string[]>([]);
  const [damagePopups,      setDamagePopups]      = React.useState<{ id: string; damage: number }[]>([]);
  const [enemyDamagePopups, setEnemyDamagePopups] = React.useState<{ id: string; damage: number }[]>([]);
  const [statGainPopups, setStatGainPopups] = React.useState<{ id: string; statType: 'block' | 'energy'; side: 'player' | 'enemy'; amount: number }[]>([]);
  const [enemyHandCards, setEnemyHandCards] = React.useState<EnemyHandCardData[]>([]);
  const [historyAtTurnStart,setHistoryAtTurnStart]=React.useState<CardHistoryEntry[]>([]);

  const monsterRef = React.useRef<MonsterAreaHandle>(null);
  const flashRef   = React.useRef<ScreenFlashHandle>(null);
  const timeline   = useCombatTimeline();

  // timer ของเอฟเฟกต์เล็กๆ ฝั่งผู้เล่น (เฟดการ์ด, สั่นมอนสเตอร์) — ล้างตอน unmount
  const cardFadeTimers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => { cardFadeTimers.current.forEach(clearTimeout); }, []);

  React.useEffect(() => {
    if (!monsterId) router.replace('/');
  }, [monsterId]);

  // ปกติ ChooseOffer บนหน้าแผนที่เซ็ตอัพคอมแบตมาให้ครบแล้ว (ศัตรู เด็ค มือแรก)
  // เหลือไว้เป็นทางสำรองกรณีเปิดหน้านี้ตรงๆ เช่นตอน dev
  React.useEffect(() => {
    if (!monsterId || bootstrapped.current) return;
    bootstrapped.current = true;
    if (!enemy && (gameState.phase === 'start' || gameState.phase === 'map')) {
      dispatch({ type: 'StartCombat', monsterId: monsterId as string });
    }
  }, [monsterId, enemy, gameState.phase]);

  const reward = gameState.lastReward ?? { exp: 0, gold: 0 };

  const playerHand = gameState.piles.hand;

  // เสียง: ในฉากต่อสู้มีเสียงบรรยากาศกลางคืนซ้อนใต้เพลง ออกจากฉากแล้วเหลือแต่เพลง
  React.useEffect(()=>{setBeds(['music','ambienceNight1']);return ()=>setBeds(['music']);},[]);
  // บอสที่มีเสียงเปิดตัว ดังครั้งเดียวตอนเข้าฉาก
  React.useEffect(()=>{const intro=BOSS_INTRO[String(monsterId??'')];if(intro)playSfx(intro);},[monsterId]);
  // จั่วการ์ด = มือเพิ่มขึ้น (ทั้งต้นเทิร์นและการ์ดที่ให้จั่ว) ดังครั้งเดียวต่อครั้งที่มือเพิ่ม
  // ต้นเทิร์นผู้เล่น (ตั้งแต่เทิร์น 2) — เคาะไม้เบา ๆ ให้รู้ว่าถึงตาเรา
  React.useEffect(()=>{if((gameState.turn??1)>1&&gameState.phase==='combat')playSfx('turnStart');},[gameState.turn]);
  const handSizeRef = React.useRef(playerHand.length);
  React.useEffect(()=>{if(playerHand.length>handSizeRef.current)playSfx('cardDraw');handSizeRef.current=playerHand.length;},[playerHand.length]);

  /**
   * เลขข้างไอคอนสำรับ = **เหลือในกองจั่วกี่ใบ**
   *
   * เดิมคิดเป็น `masterDeck + draw + discard` ซึ่งนับซ้ำ — `masterDeck` คือสำรับ
   * ถาวรของรัน ส่วน `draw` คือสำเนาที่สับไว้สำหรับไฟต์นี้ (ดู `buildAndShuffleDeck`)
   * สำรับ 12 ใบตอนเริ่มไฟต์จึงขึ้นเลข 24 มาตลอด
   *
   * ตัวเลขที่ใช้ตัดสินใจตอนสู้คือ "เหลือให้จั่วอีกกี่ใบ" ไม่ใช่ขนาดสำรับทั้งหมด
   */
  const drawCount = gameState.piles.draw.length;

  /** กองที่กำลังเปิดดู — บนหน้าจอเท่านั้น ไม่ใช่สเตตของเกม */
  const [openPile, setOpenPile] = React.useState<PileId | null>(null);
  const [blessingsOpen, setBlessingsOpen] = React.useState(false);

  const openPause = () => {
    // Finish only presentation callbacks, including the next-player helper queue.
    // No CompleteNode/Proceed/StartCombat command is issued here.
    timeline.skip(); timeline.skip();
    setPaused(true);
  };
  React.useEffect(()=>{
    const back=BackHandler.addEventListener('hardwareBackPress',()=>{
      if(mainMenu)return false;
      if(settingsOpen){setSettingsOpen(false);return true;}
      if(openPile){setOpenPile(null);return true;}
      if(blessingsOpen){setBlessingsOpen(false);return true;}
      if(paused){setPaused(false);return true;}
      openPause();return true;
    });
    return ()=>back.remove();
  },[mainMenu,settingsOpen,openPile,blessingsOpen,paused]);
  React.useEffect(()=>navigation.addListener('beforeRemove',(e)=>{
    if(allowLeave.current || useGame.getState().state.phase!=='combat')return;
    e.preventDefault();openPause();
  }),[navigation]);
  const goToMenu=async()=>{
    if(saving)return;
    setSaving(true);setSaveError('');
    try {await useGame.getState().suspendBattle();setPaused(false);setMainMenu(true);}
    catch {setSaveError('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง');}
    finally {setSaving(false);}
  };



  const [prayerAt, setPrayerAt] = React.useState<number | null>(null);
  const handlePlayCard = (card: any, index: number, wait?: number) => {
    if (turnLocked.current || phase !== 'player' || gameState.phase !== 'combat') return;
    // A prayer asks how many turns to wait before it resolves.
    if (card.type === 'prayer' && wait == null) { setPrayerAt(index); return; }
    setPrayerAt(null);
    const identifier = card.instanceId ?? card.id;
    setPlayedCardIds(prev => [...prev, identifier]);

    const prevMana = player.mana;

    dispatch({ type: 'PlayCard', index, wait });

    const t = setTimeout(
      () => setPlayedCardIds(prev => prev.filter(id => id !== identifier)),
      100
    );
    cardFadeTimers.current.push(t);

    // เทิร์นผู้เล่นให้ฟีดแบ็กทันที ไม่ต้องหน่วงเป็นคิวเหมือนเทิร์นศัตรู
    const after = useGame.getState().state;
    for (const cue of cuesFor(after.pendingEvents ?? [])) playSfx(cue);
    for (const ev of after.pendingEvents ?? []) {
      if (ev.t === 'Damage' && ev.target === 'enemy' && ev.hpLoss > 0) {
        // ตัวเลขที่โชว์คือ HP ที่หายจริง — เดิมโชว์ค่าบนการ์ดซึ่งไม่หัก block/buff
        setEnemyDamagePopups(prev => [...prev, { id: `dmg-${eventKey(ev)}`, damage: ev.hpLoss }]);
        const shakeTimer = setTimeout(() => monsterRef.current?.shake(), 250);
        cardFadeTimers.current.push(shakeTimer);
      } else if (ev.t === 'BlockGained' && ev.target === 'player') {
        setStatGainPopups(prev => [...prev, {
          id: `block-${eventKey(ev)}`,
          statType: 'block', side: 'player', amount: ev.amount,
        }]);
      }
    }

    // Mana has no event of its own; compare before and after.
    const nextMana = after.player.mana;
    if (nextMana > prevMana) {
      setStatGainPopups(prev => [...prev, {
        id: `mana-${Date.now()}`,
        statType: 'energy', side: 'player', amount: nextMana - prevMana,
      }]);
    }
  };

  const [discardNeed, setDiscardNeed] = React.useState(0);
  const handleEndTurn = () => {
    if (turnLocked.current || phase !== 'player' || gameState.phase !== 'combat') return;
    setPrayerAt(null);
    // Over the retain limit: the player picks what to discard first (NOTFM).
    const need = turnEndExcess(gameState);
    if (need > 0) { setDiscardNeed(need); return; }
    startEnemyTurn();
  };

  /**
   * เทิร์นศัตรู: engine คำนวณจนจบในทีเดียว แล้วเราเอา event ที่ได้มาเล่นเป็นอนิเมชั่น
   *
   * เดิมที่นี่ตั้ง setTimeout ยิง dispatch ทีละใบตามจังหวะอนิเมชั่น ทำให้กฎเกม
   * ผูกกับเวลาของภาพ ตอนนี้ state ถูกต้องตั้งแต่บรรทัด dispatch แล้ว
   * ที่เหลือเป็นเรื่องภาพล้วนๆ
   */
  const startEnemyTurn = () => {
    if (turnLocked.current || useGame.getState().state.phase !== 'combat') return;
    turnLocked.current = true;
    setPhase('enemy');
    setHistoryAtTurnStart(useGame.getState().state.cardHistory??[]);
    setPresentation(combatFrame(useGame.getState().state));

    dispatch({ type: 'ResolveEnemyTurn' });

    const after = useGame.getState().state;
    const events = after.pendingEvents ?? [];

    timeline.play(events, () => {
      setEnemyHandCards([]);
      setHistoryAtTurnStart(useGame.getState().state.cardHistory??[]);
      setPresentation(null);
      if (useGame.getState().state.phase === 'combat') {
        dispatch({ type: 'StartPlayerTurn' });
        turnLocked.current = false; setPhase('player');
      }
    });
  };

  // แปลง event ที่ timeline กำลังเล่นอยู่ ให้เป็นภาพบนจอ
  const currentEvent = timeline.current;
  React.useEffect(() => {
    if (!currentEvent) return;
    if (currentEvent.frame) setPresentation(currentEvent.frame);

    switch (currentEvent.t) {
      case 'EnemyCardRevealed': {
        // The frame already left this card out of the hand; take its slot out of the map too.
        const slots = handSlotsRef.current, k = currentEvent.handIndex ?? 0;
        const before = slots.remaining.length === (currentEvent.frame?.enemy?.handCount ?? -1) + 1 ? slots.remaining : Array.from({ length: (currentEvent.frame?.enemy?.handCount ?? 0) + 1 }, (_, i) => i);
        const slot = before[k] ?? k, total = Math.max(slots.total, before.length);
        handSlotsRef.current = { total, remaining: before.filter((_, i) => i !== k) };
        setEnemyHandCards([{
          key:`${gameState.turn}-${timeline.played.length}`,
          card:{id:currentEvent.cardId,ownerId:currentEvent.ownerId,name:currentEvent.name,damage:currentEvent.dmg,block:currentEvent.block,cost:currentEvent.cost,hits:currentEvent.hits,desc:currentEvent.desc},
          cardIndex:slot,totalCards:total,delay:0,playing:true,
        }]);
        break;
      }

      case 'GhostGuard': case 'GhostRiposte': case 'PlayerStunned': case 'GhostPhase':
      case 'HeavyHit': case 'Riposte': case 'RoundEnd': case 'MinionSummoned': case 'RhythmChanged': case 'Healed': case 'StatusApplied': case 'Died': {
        for (const cue of cuesFor([currentEvent])) playSfx(cue);
        break;
      }

      case 'Damage': {
        // ตัวเลขที่โชว์คือ HP ที่หายจริง ไม่ใช่ค่าบนการ์ด
        // เสียงกรงเล็บดังทุกครั้งที่ผีตีด้วยการ์ด แม้เกราะจะกันไว้หมดก็ตาม
        if (currentEvent.target === 'player' && currentEvent.sourceKind === 'card') playSfx('ghostAttack');
        else for (const cue of cuesFor([currentEvent])) playSfx(cue);
        if (currentEvent.hpLoss <= 0) break;
        const popup = { id: `dmg-${eventKey(currentEvent)}`, damage: currentEvent.hpLoss };
        if (currentEvent.target === 'player') flashRef.current?.flash();
        else monsterRef.current?.shake();
        if (currentEvent.target === 'player') setDamagePopups(prev => [...prev, popup]);
        else setEnemyDamagePopups(prev => [...prev, popup]);
        break;
      }

      case 'BlockGained': {
        for (const cue of cuesFor([currentEvent])) playSfx(cue);
        setStatGainPopups(prev => [...prev, {
          id: `block-${eventKey(currentEvent)}`,
          statType: 'block',
          side: currentEvent.target,
          amount: currentEvent.amount,
        }]);
        break;
      }
    }
  }, [currentEvent]);

  const badges:BattleBadge[]=[
    ...fightBadges(gameState),
    ...(gameState.fight?.copyNext?[{id:'skill:copy',name:'ครูสอนมวย',symbol:'check',neutral:true,detail:'การ์ดใบถัดไปที่เล่นได้สำเนาเข้ามือ'}]:[]),
    ...(gameState.fight?.nextSpellMult?[{id:'skill:spell',name:'ปลุกเสก',symbol:'spell_charging',neutral:true,detail:`คาถาใบถัดไปได้ผล ×${gameState.fight.nextSpellMult}`}]:[]),
    ...(gameState.fight?.halfDamage?[{id:'skill:half',name:'สำรวมจิต',symbol:'block',neutral:true,detail:'รับดาเมจจากผีครึ่งเดียวจนถึงเทิร์นหน้า'}]:[]),
    ...(gameState.fight?.lifestealUntil!=null&&gameState.turn<=gameState.fight.lifestealUntil?[{id:'skill:metta',name:'แผ่เมตตา',symbol:'regeneration',neutral:true,detail:'ฟื้นเลือดครึ่งหนึ่งของดาเมจที่ทำกับผี'}]:[]),
    ...(gameState.fight?.extraTurn?[{id:'skill:extra',name:'เข้าสมาธิ',symbol:'check',neutral:true,detail:'จบเทิร์นนี้แล้วได้เทิร์นเพิ่ม ผีไม่ได้เล่น'}]:[]),
    ...(gameState.traps??[]).map((t,i)=>({id:`trap:${t.cardId}:${i}`,name:t.name,symbol:'ดัก',neutral:true,detail:`${fxText(t.fx).join(' · ')}${t.negate?' · ยกเลิกการ์ดผี':''}\n${t.trigger==='enemy_attack'?'รอผีโจมตี':t.trigger==='enemy_skill'?'รอผีตั้งรับ':'รอผีเล่นการ์ด'}${t.turnsLeft!=null?` · เหลือ ${t.turnsLeft} เทิร์น`:''}`})),
  ];
  const victoryIntro=!presentation && needsVictoryIntro(gameState.phase,gameState.fightCount??0,celebratedFight)&&!timeline.isPlaying;
  React.useEffect(()=>{
    if(gameState.phase==='victory'&&celebratedFight===(gameState.fightCount??0)&&!timeline.isPlaying){dispatch({type:'CompleteNode'});router.replace('/');}
  },[gameState.phase,celebratedFight,timeline.isPlaying]);
  // hook ทั้งหมดต้องถูกเรียกก่อนถึงจะ return ได้ ไม่งั้นลำดับ hook เพี้ยน
  if (!fontsLoaded) return null;
  if(mainMenu)return <StartPage onStartGame={()=>{allowLeave.current=true;useGame.setState({state:baseNewState('')});router.replace({pathname:'/',params:{chooseClass:'1'}});}} onContinue={()=>{setMainMenu(false);}}/>;

  return (
    <View style={{ flex: 1 }}>
      <BattleBackdrop source={battleScene(gameState).source}>
        <View style={{ position: 'absolute', top: safe.top + 8, right: 10, zIndex: layer.statusBar }}>
          <CloseSeal label="พักการต่อสู้" onPress={openPause}/>
        </View>


        <CardHistory entries={phase==='enemy'?[...historyAtTurnStart,...timeline.played.flatMap(e=>e.t==='CardResolved'?[e.entry]:[])].slice(-6):(gameState.cardHistory??[])}/>

        <MonsterArea relic={bossRelicView(gameState)} minions={[...require('../src/core/combat/fightBadges').enemyDepthBadges(gameState),...require('../src/core/combat/fightBadges').ghostMechanicBadges(gameState)]} handCharges={require('../src/core/combat/ghostMechanics').enemyHandCharges(gameState)} rage={{startTurn:rageStartTurn(gameState),perTurn:RAGE.perTurn}}
          rules={gameState.pages?.adventure?.version===5}
          ref={monsterRef}
          monsterId={monsterId}
          monsterName={monsterName}
          enemy={enemy?{...enemy,drawPerTurn:gameState.enemyDrawPerTurn,maxRetained:gameState.enemyMaxRetained}:null}
          handSlots={handSlotsRef.current}
          turnLabel={`เทิร์น ${gameState.turn} · ${phase==='enemy'?'ตาผี':'ตาเรา'}`}
        />



        <ScreenFlash ref={flashRef} />

        {/* Enemy hand cards — absolute overlay, same card does slide-in + flip + rise */}
        {enemyHandCards.map(c => (
          <EnemyHandCard
            key={c.key}
            onAttackPeak={() => flashRef.current?.flash()}
            card={c.card}
            ownerId={c.card.ownerId}
            cardIndex={c.cardIndex}
            totalCards={c.totalCards}
            delay={c.delay}
            playing={c.playing}
          />
        ))}

        {/* Enemy takes damage — ใกล้ monster */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: battleLayout.monsterTop+battleLayout.monsterSize*.4, left: 0, right: 0, alignItems: 'center', zIndex: layer.popup }}
        >
          {enemyDamagePopups.map(popup => (
            <DamagePopup
              key={popup.id}
              damage={popup.damage}
              onDone={() => setEnemyDamagePopups(prev => prev.filter(p => p.id !== popup.id))}
            />
          ))}
        </View>

        {/* Player takes damage — ใกล้ Player HUD */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', bottom: safe.bottom + 100, left: 0, right: 0, alignItems: 'center', zIndex: layer.popup }}
        >
          {damagePopups.map(popup => (
            <DamagePopup
              key={popup.id}
              damage={popup.damage}
              onDone={() => setDamagePopups(prev => prev.filter(p => p.id !== popup.id))}
            />
          ))}
        </View>

        {statGainPopups.map(p => (
          <StatGainPopup
            key={p.id}
            amount={p.amount}
            statType={p.statType}
            side={p.side}
            onDone={() => setStatGainPopups(prev => prev.filter(x => x.id !== p.id))}
          />
        ))}

        {(gameState.phase==='combat'||!!presentation||timeline.isPlaying)&&<PlayerHand
          state={gameState}
          enabled={!paused && phase === 'player' && gameState.phase === 'combat'}
          cards={playerHand}
          playedCardIds={playedCardIds}
          hoveredCardId={hoveredCardId}
          onPlayCard={handlePlayCard}
          onHoverChange={(card, isHovered) => setHoveredCardId(isHovered ? (card.instanceId ?? card.id) : null)}
        />}

        {!victoryIntro&&gameState.phase==='combat'&&<MinionRow minions={gameState.minions??[]}/>}
        {/* The ghost's ลูกสมุน stand as figures on its other side (was a status badge until 15 Oct 2026). */}
        {!victoryIntro&&gameState.phase==='combat'&&<MinionRow side="enemy" minions={gameState.enemyMinions??[]}/>}

        <PlayerHUD
          blessings={!victoryIntro&&<BlessingSeals blessings={gameState.blessings}/>}
          statuses={!victoryIntro&&(badges.length||player.statusEffects?.length)?<StatusStrip effects={player.statusEffects} extra={badges}/>:null}
          helpers={!victoryIntro&&<SkillButtons state={gameState} enabled={!paused && phase === 'player' && gameState.phase === 'combat'} onUse={(id,index)=>dispatch({type:'UseSkill',id,index})}/>}
          classId={gameState.classId}
          discardCount={gameState.piles.discard.length}
          hp={player.hp}
          maxHp={player.maxHp}
          ap={player.ap}
          maxAp={player.maxAp}
          mana={player.mana}
          block={player.block}
          handCount={gameState.piles.hand.filter(c=>c.id!=='qa_phra_prathan').length} handMax={player.handMax} retain={retainLimit(gameState)} drawPerTurn={player.drawPerTurn} opening={require('../src/core/cards/hand').openingHandSize(gameState)}
          drawCount={drawCount}
          onEndTurn={handleEndTurn}
          onOpenPiles={() => setOpenPile('draw')}
          isEnemyTurn={phase === 'enemy'}
        />

        {blessingsOpen && (
          <BlessingView
            blessings={gameState.blessings}
            onClose={() => setBlessingsOpen(false)}
          />
        )}

        {/* กองจั่ว/กองทิ้ง/กองเผา — ดูได้ทุกจังหวะ ไม่ต้องหยุดเทิร์น */}
        <PileView
          piles={gameState.piles}
          deck={gameState.masterDeck}
          open={openPile}
          onChangePile={setOpenPile}
          onClose={() => setOpenPile(null)}
        />

        {discardNeed > 0 && gameState.phase === 'combat' && (
          <TurnEndDiscard hand={gameState.piles.hand} need={discardNeed} retain={retainLimit(gameState)}
            onCancel={() => setDiscardNeed(0)}
            onConfirm={indices => { dispatch({ type: 'DiscardForTurnEnd', indices }); setDiscardNeed(0); startEnemyTurn(); }} />
        )}

        {prayerAt != null && playerHand[prayerAt]?.type === 'prayer' && (
          <PrayerWaitPicker
            card={playerHand[prayerAt]}
            multBonus={gameState.blessings.reduce((n,b)=>n+(b.rules?.prayerMult??0),0)}
            onPick={wait => handlePlayCard(playerHand[prayerAt], prayerAt, wait)}
            onCancel={() => setPrayerAt(null)}
          />
        )}

        {/* ผีพูดก่อนรางวัล: คำตอบเพิ่มความกล้าหรือบุญ */}
        {!victoryIntro && !timeline.isPlaying && gameState.phase === 'talk' && gameState.ghostTalk && (
          <GhostTalkOverlay state={gameState} onAnswer={choice => dispatch({ type: 'AnswerGhostTalk', choice })} />
        )}

        {/* หลังรับทราบชัยชนะ จึงแสดงตัวเลือกเลเวลอัปที่ engine เตรียมไว้ */}
        {!victoryIntro && !timeline.isPlaying && gameState.phase === 'levelup' && gameState.levelUp && !gameState.levelUp.consumed && (
          <LevelUpOverlay
            state={gameState}
            playerLevel={player.level}
            onChoose={(option, index) =>
              dispatch({ type: 'ChooseLevelUpOption', option, index })
            }
            onSkip={() => dispatch({ type: 'SkipLevelUp' })}
          />
        )}

        {/* หลังรับทราบชัยชนะและเลือกอัปเกรด จึงแสดงการ์ดรางวัล */}
        {!victoryIntro && !timeline.isPlaying && gameState.phase === 'reward' && gameState.cardReward && (
          <CardRewardOverlay
            notice={gameState.levelUp?.result?.fight===(gameState.fightCount??0)?gameState.levelUp.result.text:undefined}
            choices={gameState.cardReward.choices}
            growth={gameState.cardReward.growth} onGrowth={option=>dispatch({type:'ChooseHandReward',option})}
            deck={gameState.masterDeck ?? []}
            onChoose={(index) => dispatch({ type: 'ChooseCardReward', index })}
            onSkip={() => dispatch({ type: 'SkipCardReward' })}
          />
        )}

        {victoryIntro && (
          <VictoryOverlay
            enemyName={ghostLore(enemy?.id??'')?.name??enemy?.name ?? (Array.isArray(monsterName) ? monsterName[0] : monsterName) ?? 'ศัตรู'}
            expGained={reward.exp}
            goldGained={reward.gold}
            playerLevel={player.level}
            playerExp={player.exp}
            playerExpToNext={player.expToNext}
            onContinue={() => {
              // ปิด node บนแผนที่ก่อนกลับ — engine จะ mark resolved,
              // หัก token ของ pool แล้วพากลับสู่ phase 'map' ให้เอง
              setCelebratedFight(gameState.fightCount??0);
            }}
          />
        )}

        {!timeline.isPlaying && !presentation && gameState.phase === 'defeat' && (
          <DefeatOverlay onHome={() => router.replace('/')} />
        )}
        {Platform.OS==='web'&&process.env.EXPO_PUBLIC_UI_REVIEW==='1'&&<Text testID="v33-battle-state" pointerEvents="none" style={{position:'absolute',opacity:0,width:1,height:1}}>{JSON.stringify({hand:gameState.piles.hand.map(c=>c.id),discard:gameState.piles.discard.length,normalHand:gameState.piles.hand.filter(c=>c.id!=='qa_phra_prathan').length,cap:gameState.player.handMax,draw:gameState.player.drawPerTurn,turn:gameState.turn,phase:gameState.phase,enemyHand:gameState.enemyPiles?.hand.length??0,presentedEnemyHand:enemy?.handCount??0,history:gameState.cardHistory,uiPhase:phase,equipped:gameState.equipped,prayers:gameState.prayers,activeMs:gameState.runMetrics?.activeMs})}</Text>}
        <Modal visible={paused} transparent animationType="fade" onRequestClose={()=>settingsOpen?setSettingsOpen(false):setPaused(false)}>
          <View style={{flex:1,backgroundColor:palette.scrimHeavy,padding:24,justifyContent:'center'}}>
            <RitualSurface kind="quietSlate" style={{padding:24,gap:14}}>
              <Text style={{fontFamily:font.heading,color:palette.moon,fontSize:22,textAlign:'center'}}>พักการต่อสู้</Text>
              <QuietButton label="สู้ต่อ" onPress={()=>setPaused(false)}/>
              <QuietButton label="ตั้งค่า" onPress={()=>setSettingsOpen(true)}/>
              {gameState.phase==='combat'&&<QuietButton label={saving?'กำลังบันทึก…':'กลับเมนูหลัก'} onPress={()=>{void goToMenu();}}/>}
              {!!saveError&&<Text style={{fontFamily:font.ui,color:palette.moon}}>{saveError}</Text>}
            </RitualSurface>
            {settingsOpen&&<Settings onClose={()=>setSettingsOpen(false)}/>}
          </View>
        </Modal>
      </BattleBackdrop>
    </View>
  );
}
