import React from 'react';
import { View, ImageBackground, Pressable, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGame } from '../src/store/gameStore';
import { enemyCardById } from '../src/core/pack_enemy_cards';

import MonsterArea, { MonsterAreaHandle } from './components/battle/MonsterArea';
import PlayerHand from './components/battle/PlayerHand';
import PlayerHUD from './components/battle/PlayerHUD';
import EnemyHandCard, { ENEMY_PLAY_TOTAL } from './components/battle/EnemyHandCard';
import DamagePopup from './components/battle/DamagePopup';
import DiscardOverlay from './components/battle/DiscardOverlay';
import VictoryOverlay from './components/battle/VictoryOverlay';
import DefeatOverlay from './components/battle/DefeatOverlay';

type Phase = 'player' | 'discard' | 'enemy';

const ENEMY_CARD_GAP    = 150;
const PLAYER_UNLOCK_MIN = 1200;
const ENEMY_SLIDE_IN    = 600;  // time for all face-down cards to slide in
const ENEMY_SLIDE_PAUSE = 200;  // pause before playing starts

type EnemyHandCardData = {
  key: string;
  card: { name: string; damage: number; block: number };
  cardIndex: number;
  totalCards: number;
  delay: number;
  playing: boolean;
};

export default function BattlePage() {
  const router    = useRouter();
  const gameState = useGame((s) => s.state);
  const dispatch  = useGame((s) => s.dispatch);
  const { monsterId, monsterName } = useLocalSearchParams();

  const player = gameState.player;
  const enemy  = gameState.enemy;

  const [phase, setPhase] = React.useState<Phase>('player');

  const [hoveredCardId,  setHoveredCardId]  = React.useState<string | null>(null);
  const [playedCardIds,  setPlayedCardIds]  = React.useState<string[]>([]);
  const [damagePopups,   setDamagePopups]   = React.useState<{ id: string; damage: number }[]>([]);
  const [enemyHandCards, setEnemyHandCards] = React.useState<EnemyHandCardData[]>([]);

  const monsterRef  = React.useRef<MonsterAreaHandle>(null);
  const timeoutRefs = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const prevHpRef   = React.useRef<number>(player.hp);

  const addTimeout = (fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timeoutRefs.current.push(id);
    return id;
  };

  React.useEffect(() => {
    return () => { timeoutRefs.current.forEach(clearTimeout); };
  }, []);

  React.useEffect(() => {
    if (!monsterId) router.replace('/');
  }, [monsterId]);

  React.useEffect(() => {
    if (monsterId && !enemy && gameState.phase !== 'combat') {
      dispatch({ type: 'StartCombat', monsterId: monsterId as string });
    }
  }, [monsterId, enemy, gameState.phase]);

  // Parse reward from engine log (format: "Victory! +X EXP, +Y gold")
  const rewardLog = React.useMemo(() => {
    const entry = [...gameState.log].reverse().find(l => /^Victory!\s+\+\d+ EXP/.test(l));
    const m = entry?.match(/\+(\d+) EXP.*\+(\d+) gold/);
    return { expGained: m ? parseInt(m[1]) : 0, goldGained: m ? parseInt(m[2]) : 0 };
  }, [gameState.phase]);

  React.useEffect(() => {
    if (player.hp < prevHpRef.current) {
      const dmg = prevHpRef.current - player.hp;
      setDamagePopups(prev => [...prev, { id: `${Date.now()}`, damage: dmg }]);
    }
    prevHpRef.current = player.hp;
  }, [player.hp]);

  const playerHand = gameState.piles.hand;
  const deckSize   = gameState.masterDeck.length + gameState.piles.draw.length +
    gameState.piles.discard.length;

  const handlePlayCard = (card: any, index: number) => {
    if (phase !== 'player') return;
    const identifier = card.instanceId ?? card.id;
    setPlayedCardIds(prev => [...prev, identifier]);
    dispatch({ type: 'PlayCard', index });
    addTimeout(() => monsterRef.current?.shake(), 250);
    addTimeout(() => setPlayedCardIds(prev => prev.filter(id => id !== identifier)), 100);
    const damage = card.dmg ?? card.damage ?? 0;
    if (damage > 0) {
      setDamagePopups(prev => [...prev, { id: `${Date.now()}-${index}`, damage }]);
    }
  };

  const handleEndTurn = () => {
    if (phase !== 'player') return;
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

  const startEnemyTurn = () => {
    setPhase('enemy');
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    dispatch({ type: 'EndTurn' });

    const afterState = useGame.getState().state;
    const playedIds: string[] = afterState.enemyLastPlayed ?? [];
    const totalCards = playedIds.length;

    const cards: EnemyHandCardData[] = playedIds.map((id, i) => {
      const def = enemyCardById(id);
      return {
        key: `${Date.now()}-${i}`,
        card: { name: def?.name ?? id, damage: def?.dmg ?? 0, block: def?.block ?? 0 },
        cardIndex: i,
        totalCards,
        delay: i * 100,
        playing: false,
      };
    });

    setEnemyHandCards(cards);

    // After slide-in, trigger each card to play sequentially
    let t = ENEMY_SLIDE_IN + ENEMY_SLIDE_PAUSE;

    cards.forEach((_, i) => {
      addTimeout(() => {
        setEnemyHandCards(prev =>
          prev.map((c, idx) => idx === i ? { ...c, playing: true } : c)
        );
      }, t);
      t += ENEMY_PLAY_TOTAL + ENEMY_CARD_GAP;
    });

    const unlockAt = Math.max(t + 200, PLAYER_UNLOCK_MIN);
    addTimeout(() => {
      setEnemyHandCards([]);
      dispatch({ type: 'StartPlayerTurn' });
      setPhase('player');
    }, unlockAt);
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../assets/scence/battleScence1.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ position: 'absolute', top: 30, right: 10, zIndex: 100 }}>
          <Pressable onPress={() => router.back()}>
            <Image
              source={require('../assets/images/btnDelete.png')}
              style={{ width: 40, height: 40 }}
              resizeMode="stretch"
            />
          </Pressable>
        </View>

        <MonsterArea
          ref={monsterRef}
          monsterId={monsterId}
          monsterName={monsterName}
          enemy={enemy ?? null}
        />

        {/* Enemy hand cards — absolute overlay, same card does slide-in + flip + rise */}
        {enemyHandCards.map(c => (
          <EnemyHandCard
            key={c.key}
            card={c.card}
            cardIndex={c.cardIndex}
            totalCards={c.totalCards}
            delay={c.delay}
            playing={c.playing}
          />
        ))}

        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 280, left: 0, right: 0, alignItems: 'center', zIndex: 150 }}
        >
          {damagePopups.map(popup => (
            <DamagePopup
              key={popup.id}
              damage={popup.damage}
              onDone={() => setDamagePopups(prev => prev.filter(p => p.id !== popup.id))}
            />
          ))}
        </View>

        <PlayerHand
          cards={playerHand}
          playedCardIds={playedCardIds}
          hoveredCardId={hoveredCardId}
          energy={player.energy}
          onPlayCard={handlePlayCard}
          onHoverChange={(card, isHovered) => setHoveredCardId(isHovered ? (card.instanceId ?? card.id) : null)}
        />

        <PlayerHUD
          hp={player.hp}
          maxHp={player.maxHp}
          energy={player.energy}
          maxEnergy={player.maxEnergy}
          block={player.block}
          maxHandSize={player.maxHandSize}
          deckSize={deckSize}
          onEndTurn={handleEndTurn}
          isEnemyTurn={phase === 'enemy'}
        />

        {phase === 'discard' && (
          <DiscardOverlay
            cards={playerHand}
            maxHandSize={player.maxHandSize}
            onConfirm={handleDiscardConfirm}
            onCancel={handleDiscardCancel}
          />
        )}

        {(gameState.phase === 'victory' || gameState.phase === 'levelup') && (
          <VictoryOverlay
            enemyName={enemy?.name ?? (Array.isArray(monsterName) ? monsterName[0] : monsterName) ?? 'ศัตรู'}
            expGained={rewardLog.expGained}
            goldGained={rewardLog.goldGained}
            playerLevel={player.level}
            playerExp={player.exp}
            playerExpToNext={player.expToNext}
            onContinue={() => router.replace('/')}
          />
        )}

        {gameState.phase === 'defeat' && (
          <DefeatOverlay onHome={() => router.replace('/')} />
        )}
      </ImageBackground>
    </View>
  );
}
