// src/core/engine/handlers/cardReward.ts — เลือกการ์ดรางวัลหลังชนะไฟต์

import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { takeCardReward, skipCardReward as clearReward } from '../../cards/reward';
import { advanceAfterVictory } from '../shared';

export function chooseCardReward(
  s: GameState,
  cmd: Extract<Command, { type: 'ChooseCardReward' }>,
  r: RNG
) {
  if (s.phase !== 'reward' || !s.cardReward) return { state: s, rng: r };

  takeCardReward(s, cmd.index);
  advanceAfterVictory(s);
  return { state: s, rng: r };
}

export function skipCardReward(
  s: GameState,
  _cmd: Extract<Command, { type: 'SkipCardReward' }>,
  r: RNG
) {
  if (s.phase !== 'reward' || !s.cardReward) return { state: s, rng: r };

  clearReward(s);
  advanceAfterVictory(s);
  return { state: s, rng: r };
}

export function chooseHandReward(s:GameState,cmd:Extract<Command,{type:'ChooseHandReward'}>,r:RNG){
 const caps=require('../../balance/notfm').LEVEL_UP.caps;
 if(s.phase!=='reward'||!s.cardReward?.growth?.includes(cmd.option))return {state:s,rng:r};
 if(cmd.option==='draw'&&s.player.drawPerTurn<caps.draw)s.player.drawPerTurn++;
 else if(cmd.option==='retain'&&(s.player.retain??2)<caps.retain)s.player.retain=(s.player.retain??2)+1;
 else return {state:s,rng:r};
 s.log.push(cmd.option==='draw'?`จั่วต่อเทิร์น +1 (${s.player.drawPerTurn})`:`มือสูงสุด +1 (${s.player.retain}) · มือเปิดศึกเพิ่มด้วย`);
 s.cardReward=undefined;advanceAfterVictory(s);return {state:s,rng:r};
}
