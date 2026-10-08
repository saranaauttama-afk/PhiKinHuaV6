// src/core/blessing/registry.ts
import type { CardData, GameState } from '../types';

type When = {
  hasTag?: string;
  type?: CardData['type'];
  cost?: number;
  status?: boolean;
};

type OnPlaySpec = {
  when?: When;
  oncePerTurnKey?: string;
  effect: (s: GameState, card: CardData) => void; // ไม่มี RNG
};

export type BlessingBehavior = {
  on_turn_start?: (s: GameState) => void;
  on_turn_end?: (s: GameState) => void;
  on_card_played?: OnPlaySpec[];
};

const behaviors: Record<string, BlessingBehavior> = {
  free_card_energy: {on_card_played:[{when:{cost:0},oncePerTurnKey:'free',effect:s=>{s.player.energy+=1;}}]},
  naga_blessing: {on_turn_start:s=>{
    s.player.energy+=1;
    require('../commands').drawUpTo(s,require('../rngState').nextStateRng(s),s.piles.hand.length+1);
  }},
  night_warrior_blessing: {on_card_played:[{when:{type:'skill'},oncePerTurnKey:'skill',effect:s=>{s.player.block+=3;}}]},
  night_shaman_blessing: {on_card_played:[{when:{status:true},oncePerTurnKey:'status',effect:s=>{s.player.block+=3;}}]},
  night_nun_blessing: {on_turn_start:s=>{if(s.player.hp<s.player.maxHp*.5)s.player.hp=Math.min(s.player.maxHp,s.player.hp+2);else s.player.block+=2;}},
  night_medium_blessing: {on_turn_start:s=>{s.player.block+=Math.min(4,(s.minions??[]).filter(m=>m.owner==='player'&&m.duration>0).length*2);}},
  regen_1: {
    on_turn_end: (s) => {
      s.player.hp = Math.min(s.player.maxHp, s.player.hp + 1);
      s.log.push('Blessing: regen +1');
    },
  },
  bl_energy_first: {
    on_card_played: [
      {
        oncePerTurnKey: 'first',
        effect: (s) => {
          s.player.energy += 1;
          s.log.push('Blessing: +1 energy (first play)');
        },
      },
    ],
  },
  block_on_attack_2: {
    on_card_played: [
      {
        when: { type: 'attack' },
        effect: (s) => {
          s.player.block += 2;
          s.log.push('Blessing: +2 Block on attack');
        },
      },
    ],
  },
  start_block_3: {
    on_turn_start: (s) => {
      s.player.block += 3;
      s.log.push('Blessing: +3 Block at start');
    },
  },
  energy_on_skill_first: {
    on_card_played: [
      {
        when: { type: 'skill' },
        oncePerTurnKey: 'skill_first',
        effect: (s) => {
          s.player.energy += 1;
          s.log.push('Blessing: +1 energy on first skill');
        },
      },
    ],
  },
  // ===== เพิ่มใหม่ (ปลอดภัย/ไม่ต้องใช้ RNG) =====
  steel_skin_1: { // จบเทิร์นได้ Block +1
    on_turn_end: (s) => {
      s.player.block += 1;
      s.log.push('Blessing: +1 Block at end');
    },
  },

  blood_thirst_1: { // เล่นการ์ดโจมตีแล้ว Heal 1
    on_card_played: [
      {
        when: { type: 'attack' },
        effect: (s) => {
          s.player.hp = Math.min(s.player.maxHp, s.player.hp + 1);
          s.log.push('Blessing: Heal 1 on attack');
        },
      },
    ],
  },

  attack_first_energy: { // การ์ดโจมตีใบแรกของเทิร์น +1 Energy
    on_card_played: [
      {
        when: { type: 'attack' },
        oncePerTurnKey: 'attack_first',
        effect: (s) => {
          s.player.energy += 1;
          s.log.push('Blessing: +1 energy on first attack');
        },
      },
    ],
  },

  skill_shield_1: { // เล่นสกิลทุกครั้งได้ Block +1
    on_card_played: [
      {
        when: { type: 'skill' },
        effect: (s) => {
          s.player.block += 1;
          s.log.push('Blessing: +1 Block on skill');
        },
      },
    ],
  },

  special_refund_1: { // ใบที่ cost>=1 ใบแรกของเทิร์น คืนพลัง +1
    on_card_played: [
      {
        oncePerTurnKey: 'special_refund_first',
        effect: (s, card) => {
          if ((card.cost ?? 0) >= 1) {
            s.player.energy += 1;
            s.log.push('Blessing: +1 energy (first costly card)');
          }
        },
      },
    ],
  },  
};

export function getBlessingBehavior(id: string): BlessingBehavior | undefined {
  const aliases: Record<string,string> = {
    ancestral_blessing:'regen_1', spirit_energy:'bl_energy_first', ghost_protection:'block_on_attack_2',
    meditation_peace:'start_block_3', herbal_wisdom:'energy_on_skill_first', sacred_cloth:'steel_skin_1',
    life_steal_spirit:'blood_thirst_1', bamboo_dart_power:'attack_first_energy', ritual_shield:'skill_shield_1',
  };
  return behaviors[aliases[id] ?? id];
}
