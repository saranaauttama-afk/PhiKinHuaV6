// src/core/engine/handlers/ui.ts
// UI-related commands (deck toggle, etc.)

import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';

export function openDeck(s: GameState, _cmd: Extract<Command, { type: 'OpenDeck' }>, r: RNG) {
  s.deckOpen = true;
  return { state: s, rng: r };
}

export function closeDeck(s: GameState, _cmd: Extract<Command, { type: 'CloseDeck' }>, r: RNG) {
  s.deckOpen = false;
  return { state: s, rng: r };
}
export function setEquipmentLoadout(s:GameState,cmd:Extract<Command,{type:'SetEquipmentLoadout'}>,r:RNG){
 const {validEquipmentSelection}=require('../../cards/equipment');
 if(['combat','victory','defeat','reward','levelup'].includes(s.phase)||!validEquipmentSelection(s,cmd.indices))return {state:s,rng:r};
 s.equipmentLoadout=cmd.indices.map(i=>s.masterDeck[i].ownedId!);
 return {state:s,rng:r};
}
