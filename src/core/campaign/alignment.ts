// src/core/campaign/alignment.ts — ความกล้า / บุญ.
//
// After some wins a ghost speaks. Taking its offer or challenging it is ความกล้า; releasing
// or helping it is บุญ. Each side reaching the threshold grants a blessing once, and at the
// end of night 3 the two values pick the final boss.
import type { AlignmentChoice, BlessingDef, GameState } from '../types';
import { ALIGNMENT } from '../balance/notfm';
import { NIGHT_BOSSES, ULTIMATE_BOSS } from './bosses';
import talksJson from '../../data/packs/base/ghost_talks.json';
import alignmentBlessingsJson from '../../data/packs/base/alignment_blessings.json';

export type GhostTalk = { line: string; courage: string; merit: string };
const TALKS: Record<string, GhostTalk> = talksJson as any;
export const ALIGNMENT_BLESSINGS: Record<'courage' | 'merit', BlessingDef> = {
  courage: (alignmentBlessingsJson as any[]).find(b => b.id === 'courage_oath'),
  merit: (alignmentBlessingsJson as any[]).find(b => b.id === 'merit_aura'),
};

export function ghostTalk(id: string): GhostTalk | undefined { return TALKS[id]; }
export function talkIds(): string[] { return Object.keys(TALKS); }

/**
 * After a win: the ghost speaks if it has a dialogue, the night still has room, and it is
 * an elite, the night's boss, or a ghost not yet talked to this run. Night-3 bosses end the run.
 */
export function queueGhostTalk(s: GameState): void {
  const c = s.campaign, id = s.enemy?.id;
  if (!c || !id || !TALKS[id]) return;
  if ((c.talksThisNight ?? 0) >= ALIGNMENT.talksPerNight) return;
  const offer = s.pages?.current?.offers[s.pages?._activeOfferIndex ?? -1];
  const special = offer?.kind === 'boss' || (offer?.kind === 'monster' && offer.tier === 'elite');
  if (offer?.kind === 'boss' && c.night === 3) return;
  if (!special && c.talked?.includes(id)) return;
  s.ghostTalk = { ghostId: id };
}

/** Answer the waiting dialogue. Returns false when there is none. */
export function answerGhostTalk(s: GameState, choice: AlignmentChoice): boolean {
  const c = s.campaign, talk = s.ghostTalk;
  if (!c || !talk) return false;
  c.talked = [...new Set([...(c.talked ?? []), talk.ghostId])];
  c.talksThisNight = (c.talksThisNight ?? 0) + 1;
  if (choice === 'courage') {
    c.courage = Math.min(ALIGNMENT.max, (c.courage ?? 0) + 1);
    s.player.gold += ALIGNMENT.courageGold;
  } else if (choice === 'merit') {
    c.merit = Math.min(ALIGNMENT.max, (c.merit ?? 0) + 1);
    s.player.hp = Math.min(s.player.maxHp, s.player.hp + ALIGNMENT.meritHeal);
  }
  for (const side of ['courage', 'merit'] as const) {
    if ((c[side] ?? 0) >= ALIGNMENT.threshold && !c.alignmentRewards?.includes(side)) {
      c.alignmentRewards = [...(c.alignmentRewards ?? []), side];
      const b = ALIGNMENT_BLESSINGS[side];
      if (!s.blessings.some(x => x.id === b.id)) s.blessings.push(JSON.parse(JSON.stringify(b)));
      s.log.push(`${side === 'courage' ? 'ความกล้า' : 'บุญ'}ถึง ${ALIGNMENT.threshold}: ได้พร ${b.name}`);
    }
  }
  s.ghostTalk = undefined;
  return true;
}

/** Both sides at the threshold on a veteran run reveal the secret boss. */
export function secretBossReady(s: Partial<GameState>): boolean {
  const c = s.campaign;
  return !!c?.veteran && (c.courage ?? 0) >= ALIGNMENT.threshold && (c.merit ?? 0) >= ALIGNMENT.threshold;
}

/**
 * The night-3 boss from ความกล้า / บุญ: more courage → ปอบครูอาคม, more merit → พรายแอ่งถ้ำ,
 * equal → ผีป่าไทรพันราก. `allowSecret` is false where the secret boss already comes later.
 */
export function alignmentBoss(s: Partial<GameState>, allowSecret = true) {
  const courage = s.campaign?.courage ?? 0, merit = s.campaign?.merit ?? 0;
  if (allowSecret && secretBossReady(s)) return ULTIMATE_BOSS;
  if (courage > merit) return NIGHT_BOSSES[4];
  if (merit > courage) return NIGHT_BOSSES[3];
  return NIGHT_BOSSES[2];
}
