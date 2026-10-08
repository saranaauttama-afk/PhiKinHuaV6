import {battleScene} from './scenePresentation';
import React from 'react';
import { View, ImageBackground, Pressable, Image, Text, Modal, BackHandler } from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useGame } from '../src/store/gameStore';
import type { CombatEvent, CombatFrame } from '../src/core/types';

import { combatFrame } from '../src/core/combat/damage';
import MonsterArea, { MonsterAreaHandle } from './components/battle/MonsterArea';
import PlayerHand from './components/battle/PlayerHand';
import PlayerHUD from './components/battle/PlayerHUD';
import EnemyHandCard from './components/battle/EnemyHandCard';
import DamagePopup from './components/battle/DamagePopup';
import StatGainPopup from './components/battle/StatGainPopup';
import DiscardOverlay from './components/battle/DiscardOverlay';
import VictoryOverlay from './components/battle/VictoryOverlay';
import {needsVictoryIntro} from './postBattleFlow';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import DefeatOverlay from './components/battle/DefeatOverlay';
import LevelUpOverlay from './components/battle/LevelUpOverlay';
import CardRewardOverlay from './components/battle/CardRewardOverlay';
import PileView, { type PileId } from './components/battle/PileView';
import StatusStrip, {type BattleBadge} from './components/battle/StatusStrip';
import {COMBO_BY_ID,comboTarget} from '../src/core/combat/combos';
import MinionRow from './components/battle/MinionRow';
import BlessingView from './components/BlessingView';
import { useCombatTimeline } from './components/battle/useCombatTimeline';
import ScreenFlash, { ScreenFlashHandle } from './components/battle/ScreenFlash';
import { useAppFonts } from './useAppFonts';
import { palette, surface, tint, layer, font } from './theme';

import Settings from './components/Settings';
import StartPage from './components/StartPage';
import RitualSurface from './components/RitualSurface';
import {GameButton} from './components/Panel';
import {baseNewState} from '../src/core/commands';

type Phase = 'player' | 'discard' | 'enemy';

/** key ที่ไม่ซ้ำสำหรับ popup ของแต่ละ event */
let _popupSeq = 0;
const eventKey = (_ev: CombatEvent) => `${++_popupSeq}`;

type EnemyHandCardData = {
  key: string;
  card: { id?: string; name: string; damage: number; block: number; cost?: number; hits?: number; desc?: string };
  cardIndex: number;
  totalCards: number;
  delay: number;
  playing: boolean;
};

export default function BattlePage() {
  const router    = useRouter();
  const safe = useSafeAreaInsets();
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
  const { monsterId, monsterName } = useLocalSearchParams();
  // หน้านี้ใช้ฟอนต์เหมือนหน้าอื่นแต่เดิมไม่เคยโหลดเอง — รอดมาเพราะปกติผู้เล่น
  // เดินผ่านหน้าแผนที่ก่อนเสมอ แต่ expo-router เปิดตรงเข้าหน้านี้ได้
  const [fontsLoaded] = useAppFonts();

  const [presentation, setPresentation] = React.useState<CombatFrame | null>(null);
  const player = presentation?.player ?? gameState.player;
  const enemy = presentation?.enemy ?? gameState.enemy;
  const [comboNotice,setComboNotice]=React.useState('');
  const seenCombos=React.useRef(gameState.combo?.done??[]);
  React.useEffect(()=>{
    const done=gameState.combo?.done??[];
    const fresh=done.filter(id=>!seenCombos.current.includes(id));
    seenCombos.current=done;
    if(!fresh.length){if(!done.length)setComboNotice('');return;}
    setComboNotice(fresh.map(id=>COMBO_BY_ID[id]?.name??id).join(' · '));
    const timer=setTimeout(()=>setComboNotice(''),2400);
    return ()=>clearTimeout(timer);
  },[gameState.combo?.done.join('|')]);
  const bootstrapped = React.useRef(false);
  const turnLocked = React.useRef(false);

  const [phase, setPhase] = React.useState<Phase>('player');

  const [hoveredCardId,  setHoveredCardId]  = React.useState<string | null>(null);
  const [playedCardIds,  setPlayedCardIds]  = React.useState<string[]>([]);
  const [damagePopups,      setDamagePopups]      = React.useState<{ id: string; damage: number }[]>([]);
  const [enemyDamagePopups, setEnemyDamagePopups] = React.useState<{ id: string; damage: number }[]>([]);
  const [statGainPopups, setStatGainPopups] = React.useState<{ id: string; statType: 'block' | 'energy'; side: 'player' | 'enemy'; amount: number }[]>([]);
  const [enemyHandCards, setEnemyHandCards] = React.useState<EnemyHandCardData[]>([]);

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



  const handlePlayCard = (card: any, index: number) => {
    if (turnLocked.current || phase !== 'player' || gameState.phase !== 'combat') return;
    const identifier = card.instanceId ?? card.id;
    setPlayedCardIds(prev => [...prev, identifier]);

    const prevEnergy = player.energy;

    dispatch({ type: 'PlayCard', index });

    const t = setTimeout(
      () => setPlayedCardIds(prev => prev.filter(id => id !== identifier)),
      100
    );
    cardFadeTimers.current.push(t);

    // เทิร์นผู้เล่นให้ฟีดแบ็กทันที ไม่ต้องหน่วงเป็นคิวเหมือนเทิร์นศัตรู
    const after = useGame.getState().state;
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

    // energy ยังไม่มี event ของตัวเอง — เทียบค่าก่อน/หลังไปก่อน
    const nextEnergy = after.player.energy;
    if (nextEnergy > prevEnergy) {
      setStatGainPopups(prev => [...prev, {
        id: `energy-${Date.now()}`,
        statType: 'energy', side: 'player', amount: nextEnergy - prevEnergy,
      }]);
    }
  };

  const handleEndTurn = () => {
    if (turnLocked.current || phase !== 'player' || gameState.phase !== 'combat') return;
    if (playerHand.length > player.maxHandSize) {
      setPhase('discard');
      return;
    }
    startEnemyTurn();
  };

  const handleDiscardConfirm = (discardedIndices: number[]) => {
    [...discardedIndices].sort((a, b) => b - a).forEach(idx => {
      dispatch({ type: 'DiscardCard', index: idx });
    });
    startEnemyTurn();
  };

  const handleDiscardCancel = () => setPhase('player');

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
    setPresentation(combatFrame(useGame.getState().state));

    dispatch({ type: 'ResolveEnemyTurn' });

    const after = useGame.getState().state;
    const events = after.pendingEvents ?? [];

    // เตรียมการ์ดคว่ำทั้งมือให้เห็นก่อน แล้วค่อยเปิดทีละใบตาม event
    const revealOrder = events.filter(e => e.t === 'EnemyCardRevealed');
    setEnemyHandCards(
      revealOrder.map((e, i) => ({
        key: `${i}-${e.cardId}`,
        card: { id: e.cardId, name: e.name, damage: e.dmg, block: e.block, cost: e.cost, hits: e.hits, desc: e.desc },
        cardIndex: i,
        totalCards: revealOrder.length,
        delay: i * 100,
        playing: false,
      }))
    );

    timeline.play(events, () => {
      setEnemyHandCards([]);
      setPresentation(null);
      if (useGame.getState().state.phase === 'combat') {
        const before = combatFrame(useGame.getState().state);
        dispatch({ type: 'StartPlayerTurn' });
        const startEvents = useGame.getState().state.pendingEvents ?? [];
        if (startEvents.some(e => e.t === 'MinionActing')) {
          setPresentation(before);
          timeline.play(startEvents, () => { setPresentation(null); turnLocked.current = false; setPhase('player'); });
        } else { turnLocked.current = false; setPhase('player'); }
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
        // ใบที่เท่าไหร่ ดูจากจำนวน reveal ที่เล่นไปแล้ว
        const idx = timeline.played.filter(e => e.t === 'EnemyCardRevealed').length - 1;
        setEnemyHandCards(prev => prev.map((c, i) => (i === idx ? { ...c, playing: true } : c)));
        break;
      }

      case 'Damage': {
        // ตัวเลขที่โชว์คือ HP ที่หายจริง ไม่ใช่ค่าบนการ์ด
        if (currentEvent.hpLoss <= 0) break;
        const popup = { id: `dmg-${eventKey(currentEvent)}`, damage: currentEvent.hpLoss };
        if (currentEvent.target === 'player') flashRef.current?.flash();
        else monsterRef.current?.shake();
        if (currentEvent.target === 'player') setDamagePopups(prev => [...prev, popup]);
        else setEnemyDamagePopups(prev => [...prev, popup]);
        break;
      }

      case 'BlockGained': {
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
    ...(gameState.traps??[]).map((t,i)=>({id:`trap:${t.cardId}:${i}`,name:t.name,symbol:'ดัก',neutral:true,detail:`${t.effects.map(e=>e.desc).join(' · ')}\n${t.trigger==='enemy_attack'?'รอผีโจมตี':t.trigger==='enemy_skill'?'รอผีตั้งรับ':'รอผีเล่นการ์ด'}${t.turnsLeft!=null?` · เหลือ ${t.turnsLeft} เทิร์น`:''}`})),
    ...(gameState.combo?.progress??[]).flatMap(p=>{const c=COMBO_BY_ID[p.comboId];return c?[{id:`combo:${p.comboId}`,name:c.name,symbol:'ชุด',neutral:true,count:`${p.cardsPlayed.length}/${comboTarget(c)}`,detail:`${c.desc}\nเล่นแล้ว ${p.cardsPlayed.length}/${comboTarget(c)} ใบ${c.ordered?' · ต้องเล่นตามลำดับ':''}`}]:[]}),
    ...(gameState.combo?.done??[]).flatMap(id=>{const c=COMBO_BY_ID[id];return c?[{id:`done:${id}`,name:c.name,symbol:'✓',detail:`${c.desc}\nคอมโบทำงานแล้วในไฟต์นี้`}]:[]}),
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
      <ImageBackground
        source={battleScene(gameState).source}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ position: 'absolute', top: safe.top + 8, right: 10, zIndex: layer.statusBar }}>
          <Pressable accessibilityRole="button" accessibilityLabel="พักการต่อสู้" onPress={openPause} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}>
            <Image
              source={require('../assets/images/btnDelete.png')}
              style={{ width: 40, height: 40 }}
              resizeMode="stretch"
            />
          </Pressable>
        </View>

        {!!comboNotice&&<View pointerEvents="none" style={{position:'absolute',top:safe.top+190,left:24,right:24,zIndex:layer.overlay,alignItems:'center'}}><RitualSurface kind="wood" style={{paddingHorizontal:18,paddingVertical:10}}><Text style={{fontFamily:font.heading,color:palette.moon,fontSize:18,textAlign:'center'}}>คอมโบ! {comboNotice}</Text></RitualSurface></View>}

        {/* ข้ามอนิเมชั่นเทิร์นศัตรู — ปลอดภัยเสมอ เพราะ state ถูกคำนวณจบไปแล้ว
            ก่อนอนิเมชั่นเริ่มเล่น สิ่งเดียวที่ถูกข้ามคือภาพ */}
        {timeline.isPlaying && (
          <Pressable
            onPress={timeline.skip}
            style={{
              position: 'absolute', top: safe.top + 110, left: 14, zIndex: layer.control,
              paddingHorizontal: 14, paddingVertical: 6,
              borderRadius: 14,
              backgroundColor: surface.glassDim,
              borderWidth: 1, borderColor: palette.line,
            }}
          >
            <Text style={{
              color: palette.text, fontSize: 12,
              fontFamily: 'Prompt_600SemiBold',
            }}>
              ข้าม ▸▸
            </Text>
          </Pressable>
        )}

        <MonsterArea escalating={gameState.runMode==='episode'}
          ref={monsterRef}
          monsterId={monsterId}
          monsterName={monsterName}
          enemy={enemy ?? null}
          turnLabel={`เทิร์น ${gameState.turn} · ${phase==='enemy'?'ตาผี':'ตาเรา'}`}
          helpers={<MinionRow owner="enemy" minions={presentation?.minions??gameState.minions} activeId={currentEvent?.t==='MinionActing'?currentEvent.minionId:undefined}/> }
        />



        <ScreenFlash ref={flashRef} />

        {/* Enemy hand cards — absolute overlay, same card does slide-in + flip + rise */}
        {enemyHandCards.map(c => (
          <EnemyHandCard
            key={c.key}
            onAttackPeak={() => flashRef.current?.flash()}
            card={c.card}
            cardIndex={c.cardIndex}
            totalCards={c.totalCards}
            delay={c.delay}
            playing={c.playing}
          />
        ))}

        {/* Enemy takes damage — ใกล้ monster */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 280, left: 0, right: 0, alignItems: 'center', zIndex: layer.popup }}
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
          style={{ position: 'absolute', bottom: safe.bottom + 240, left: 0, right: 0, alignItems: 'center', zIndex: layer.popup }}
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

        <PlayerHand
          state={gameState}
          enabled={!paused && phase === 'player' && gameState.phase === 'combat'}
          cards={playerHand}
          playedCardIds={playedCardIds}
          hoveredCardId={hoveredCardId}
          energy={player.energy}
          cardsPlayedThisTurn={gameState.turnFlags?.cardsPlayed ?? 0}
          onPlayCard={handlePlayCard}
          onHoverChange={(card, isHovered) => setHoveredCardId(isHovered ? (card.instanceId ?? card.id) : null)}
        />

        <PlayerHUD
          helpers={<MinionRow owner="player" minions={presentation?.minions??gameState.minions} activeId={currentEvent?.t==='MinionActing'?currentEvent.minionId:undefined}/>}
          statuses={(badges.length||player.statusEffects?.length)?<StatusStrip effects={player.statusEffects} extra={badges}/>:null}
          classId={gameState.classId}
          discardCount={gameState.piles.discard.length}
          hp={player.hp}
          maxHp={player.maxHp}
          energy={player.energy}
          maxEnergy={player.maxEnergy}
          block={player.block}
          maxHandSize={player.maxHandSize}
          drawCount={drawCount}
          onEndTurn={handleEndTurn}
          onOpenPiles={() => setOpenPile('draw')}
          isEnemyTurn={phase === 'enemy'}
        />

        {/* พรติดตัว — กดดูได้ระหว่างสู้ เพราะพรทุกอย่างกำลังทำงานอยู่ตอนนี้ */}
        {(gameState.blessings?.length ?? 0) > 0 && (
          <Pressable
            onPress={() => setBlessingsOpen(true)}
            hitSlop={8}
            style={{
              position: 'absolute', top: safe.top + 8, right: 60, zIndex: layer.control,
              paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: tint.moonSoft,
              borderWidth: 1, borderColor: palette.lineStrong,
            }}
          >
            <Text style={{ color: palette.moon, fontSize: 11, fontFamily: 'Prompt_600SemiBold' }}>
              พร {gameState.blessings.length}
            </Text>
          </Pressable>
        )}

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

        {phase === 'discard' && (
          <DiscardOverlay
            cards={playerHand}
            maxHandSize={player.maxHandSize}
            onConfirm={handleDiscardConfirm}
            onCancel={handleDiscardCancel}
          />
        )}

        {/* หลังรับทราบชัยชนะ จึงแสดงตัวเลือกเลเวลอัปที่ engine เตรียมไว้ */}
        {!victoryIntro && !timeline.isPlaying && gameState.phase === 'levelup' && gameState.levelUp?.choice && (
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
            deck={gameState.masterDeck ?? []}
            onChoose={(index) => dispatch({ type: 'ChooseCardReward', index })}
            onSkip={() => dispatch({ type: 'SkipCardReward' })}
          />
        )}

        {victoryIntro && (
          <VictoryOverlay
            enemyName={enemy?.name ?? (Array.isArray(monsterName) ? monsterName[0] : monsterName) ?? 'ศัตรู'}
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
        <Modal visible={paused} transparent animationType="fade" onRequestClose={()=>settingsOpen?setSettingsOpen(false):setPaused(false)}>
          <View style={{flex:1,backgroundColor:palette.scrimHeavy,padding:24,justifyContent:'center'}}>
            <RitualSurface kind="wood" style={{padding:24,gap:14}}>
              <Text style={{fontFamily:font.heading,color:palette.moon,fontSize:22,textAlign:'center'}}>พักการต่อสู้</Text>
              <GameButton label="สู้ต่อ" onPress={()=>setPaused(false)}/>
              <GameButton label="ตั้งค่า" onPress={()=>setSettingsOpen(true)}/>
              {gameState.phase==='combat'&&<GameButton label={saving?'กำลังบันทึก…':'กลับเมนูหลัก'} onPress={()=>{void goToMenu();}}/>}
              {!!saveError&&<Text style={{fontFamily:font.ui,color:palette.moon}}>{saveError}</Text>}
            </RitualSurface>
            {settingsOpen&&<Settings onClose={()=>setSettingsOpen(false)}/>}
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}
