import { describe, it, expect } from 'vitest';
import { baseNewState } from '../src/core/commands';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import { cardById } from '../src/core/pack';
import { withConditional } from '../src/core/cards/mechanics';
import { rollChapterCards, CHAPTER_REWARD_LANES } from '../src/core/cards/chapterRewards';
import { resolveEnemyCard } from '../src/core/combat/enemyCardEffects';
import { enemyCardById } from '../src/core/pack_enemy_cards';
import { getMonsterById } from '../src/core/monsters/thai-ghosts';
import { deckForMonster } from '../src/core/monsters/monster-decks';
import { summonMinion } from '../src/core/minionRuntime';
import type { Command } from '../src/core/types';
import type { ClassId } from '../src/core/classes';
import { conditionMet, effectiveCost } from '../src/core/cards/mechanics';

function run(seed: string, classId: ClassId) {
  let state = baseNewState(seed), rng = makeRng(seed);
  const go = (cmd: Command) => { const result = applyCommand(state, cmd, rng); state = result.state; rng = result.rng; };
  go({ type: 'NewRun', seed, classId, runMode: 'episode' });
  go({ type: 'SkipChapter' }); go({ type: 'ChooseStarterBlessing', index: 0 });
  return { get state() { return state; }, go };
}
function simulate(seed: string, cls: ClassId, tactical: boolean) {
  const d = run(seed, cls); let turns = 0;
  for (let fight = 0; fight < 3; fight++) {
    d.go({ type: 'ChooseOffer', index: Number(seed.split('-').at(-1)) % (fight === 2 ? 1 : 2) });
    for (let turn = 0; d.state.phase === 'combat' && turn < 40; turn++) {
      for (let play = 0; d.state.phase === 'combat' && play < 30; play++) {
        const s = d.state;
        const choices = s.piles.hand.map((card,index) => {
          const c = withConditional(s, card);
          const score = tactical ? (c.dmg ?? 0) * (c.hits ?? 1) + Math.min(c.block ?? 0, Math.max(0, 12 - s.player.block)) * 0.8
            + (c.energyGain ?? 0) * 8 + (c.draw ?? 0) * 3 + (c.summonMinion ? 12 : 0)
            + ((c as any).statusEffect?.effect === 'poison' ? 8 : 0)
            + ((c as any).statusEffect?.effect === 'strength' ? 6 : 0) : -index;
          return {index, score: effectiveCost(s,card) <= s.player.energy ? score : -Infinity};
        }).sort((a,b)=>b.score-a.score);
        if (!Number.isFinite(choices[0]?.score)) break;
        d.go({ type: 'PlayCard', index: choices[0].index });
      }
      if (d.state.phase !== 'combat') break;
      while(d.state.piles.hand.length > d.state.player.maxHandSize) d.go({type:'DiscardCard',index:d.state.piles.hand.length-1});
      d.go({type:'ResolveEnemyTurn'}); if(d.state.phase==='combat') d.go({type:'StartPlayerTurn'}); turns++;
    }
    if(d.state.phase==='levelup') d.go({type:'SkipLevelUp'});
    if(d.state.phase==='reward') d.go({type:'ChooseCardReward',index:0});
    if(d.state.phase!=='victory') break;
    d.go({type:'CompleteNode'});
    if(fight===0){d.go({type:'ChooseOffer',index:0});d.go({type:'ChooseEventOption',index:0});d.go({type:'CompleteNode'});d.go({type:'Proceed'});}
    else if(fight===1){d.go({type:'ChooseOffer',index:0});d.go({type:'UseHealingShrine'});d.go({type:'CompleteNode'});d.go({type:'Proceed'});}
  }
  return {won:!!d.state.runSummary?.won, hp:d.state.player.hp, turns};
}
describe('chapter class builds and ghost signatures',()=>{
  it('counterattack depends on setup order and leaves the base card unchanged',()=>{
    const s=run('counter','warrior').state; const card=cardById('ward_riposte')!;
    s.player.block=7; expect(withConditional(s,card).dmg).toBe(5);
    s.player.block=8; expect(withConditional(s,card).dmg).toBe(14); expect(card.dmg).toBe(5);
  });
  it('new build cards resolve through the real play command, with costs and exhaust',()=>{
    const d=run('real-build','medium');d.go({type:'ChooseOffer',index:0});
    const s=d.state;s.player.energy=3;s.piles.hand=[JSON.parse(JSON.stringify(cardById('spirit_pact')))];
    d.go({type:'PlayCard',index:0});
    expect(d.state.player.energy).toBe(4);
    expect(d.state.piles.exhaust.some(c=>c.id==='spirit_pact')).toBe(true);
    const c=run('real-counter','warrior');c.go({type:'ChooseOffer',index:0});
    c.state.player.block=10;c.state.piles.hand=[JSON.parse(JSON.stringify(cardById('ward_riposte')))];
    const hp=c.state.enemy!.hp;c.go({type:'PlayCard',index:0});
    expect(hp-c.state.enemy!.hp).toBe(14);expect(c.state.player.energy).toBe(2);
  });
  it('spirit engine counts only living allied helpers',()=>{
    const s=run('pact','medium').state; s.minions=[];
    const cond={kind:'player_minions_at_least' as const,value:2};
    summonMinion(s,'ghost_ally','player',1); summonMinion(s,'ghost_ally','enemy',1);
    expect(conditionMet(s,cond)).toBe(false); summonMinion(s,'ghost_ally','player',1);
    expect(conditionMet(s,cond)).toBe(true); s.minions[0].duration=0;
    expect(conditionMet(s,cond)).toBe(false);
  });
  it('reward lanes are deterministic, distinct, class restricted and independently cloned',()=>{
    for(const cls of ['warrior','medium','nun','shaman'] as const) for(let n=0;n<40;n++){
      const a=rollChapterCards(cls,makeRng(String(n)))!, b=rollChapterCards(cls,makeRng(String(n)))!;
      expect(a).toEqual(b);expect(new Set(a.list.map(c=>c.id)).size).toBe(3);
      a.list.forEach((c,i)=>{expect(c.tags).toContain(cls);expect(CHAPTER_REWARD_LANES[cls]![i]).toContain(c.id);});
      a.list[0].dmg=999;expect(cardById(a.list[0].id)?.dmg).not.toBe(999);
    }
  });
  it('every authored enemy deck references valid owned cards',()=>{
    for(const id of ['phi-pop','nang-tanee','phi-krasue','phi-nang-ram','phi-pong-kang']){
      const cfg=deckForMonster(getMonsterById(id)!); expect(cfg.lists![0].cards).toHaveLength(15);
      for(const card of cfg.lists![0].cards) expect(cfg.pool.allowOwners).toContain(enemyCardById(card)?.owner);
    }
  });
  it('ghost signatures really heal, poison, weaken, hit twice and build strength',()=>{
    const d=run('ghost-effects','warrior');d.go({type:'ChooseOffer',index:0});const s=d.state;
    s.player.block=0;s.enemy!.hp=10;
    resolveEnemyCard(s,enemyCardById('pop_feast')!);expect(s.enemy!.hp).toBe(12);
    resolveEnemyCard(s,enemyCardById('krasue_venom')!);expect(s.player.statusEffects?.find(x=>x.id==='poison')?.stacks).toBe(2);
    resolveEnemyCard(s,enemyCardById('tanee_roots')!);expect(s.player.statusEffects?.some(x=>x.id==='weakness')).toBe(true);
    const before=s.player.hp;resolveEnemyCard(s,enemyCardById('dancer_steps')!);expect(before-s.player.hp).toBe(8);
    resolveEnemyCard(s,enemyCardById('pong_fury')!);expect(s.enemy!.statusEffects?.some(x=>x.id==='strength')).toBe(true);
  });
  for(const cls of ['warrior','medium'] as const) it(`${cls}: seeded real-card pilot has pressure without hidden intent knowledge`,()=>{
    const results=[false,true].map(tactical=>{
      const runs=Array.from({length:40},(_,n)=>simulate(`pilot-${cls}-${n}`,cls,tactical));
      return {policy:tactical?'board-tactical':'first-affordable',wins:runs.filter(x=>x.won).length,meanHp:+(runs.reduce((a,x)=>a+x.hp,0)/runs.length).toFixed(1),meanTurns:+(runs.reduce((a,x)=>a+x.turns,0)/runs.length).toFixed(1)};
    });
    console.log('BUILD_PILOT',cls,JSON.stringify(results));
    // Harder chapter: a deliberately limited policy skips every upgrade and new rest reward.
    // Keep a 40% completion floor for this baseline; human win rates are not inferred.
    expect(results[1].wins).toBeGreaterThanOrEqual(16);
    expect(results[1].meanHp).toBeLessThan(cls==='warrior'?60:43);
  });
});
