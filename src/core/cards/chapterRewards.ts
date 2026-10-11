import type { ClassId } from '../classes';
import type { CardData } from '../types';
import type { RNG } from '../rng';
import { int } from '../rng';
import { cardById } from '../pack';

/** One attack, one setup/defense and one engine option: each pick has a purpose. */
export const CHAPTER_REWARD_LANES: Partial<Record<ClassId, string[][]>> = {
  shaman: [
    ['cursed_needle','curse_chant','bamboo_dart'],
    ['cooling_cloth','create_kuman','holy_powder'],
    ['direct_poison_spell','meditation','spirit_whisper'],
  ],
  nun: [
    ['dharma_wheel','merit_shield','dharma_wheel'],
    ['holy_water','loving_kindness','dispel_ill'],
    ['five_precepts','alms_offering','chant_sutra'],
  ],
  warrior: [
    ['ward_riposte', 'last_stand_cut', 'threefold_strike', 'death_throes'],
    ['parry_step', 'stand_firm', 'held_charm'],
    ['iron_will', 'war_cry', 'fighter_breath'],
  ],
  medium: [
    ['poison_echo', 'salt_in_wound', 'spirit_possess'],
    ['house_guardian', 'call_phrai', 'ancestor_council'],
    ['spirit_pact', 'snail_call', 'phrai_oil'],
  ],
};
export function rollChapterCards(classId: ClassId, rng: RNG): { list: CardData[]; rng: RNG } | undefined {
  const lanes = CHAPTER_REWARD_LANES[classId];
  if (!lanes) return undefined;
  let r = rng;
  const list = lanes.map(lane => {
    const roll = int(r, 0, lane.length - 1); r = roll.rng;
    const card = cardById(lane[roll.value]);
    if (!card) throw new Error(`Missing chapter card ${lane[roll.value]}`);
    return JSON.parse(JSON.stringify(card)) as CardData;
  });
  return { list, rng: r };
}
