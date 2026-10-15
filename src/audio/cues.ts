import type { CombatEvent } from '../core/types';
import type { SfxId } from './manifest';

/**
 * Which sounds a batch of combat events should play — pure, so it is tested without a device.
 *
 * - One sound per kind per batch: a card that hits three times plays one hit, not three.
 * - A heavy move (ท่าหนัก) replaces the ordinary hit sound; a death replaces the hit that caused it.
 * - Ghost hits on the player keep their own sound (`ghostAttack`, wired in battle.tsx).
 * Why the sounds exist and how they were made: docs/audio/AUDIO.md.
 */
export function cuesFor(events: CombatEvent[]): SfxId[] {
  const out = new Set<SfxId>();
  let rhythm: number | undefined;
  for (const e of events) {
    switch (e.t) {
      case 'Damage':
        if (e.target === 'enemy' && e.sourceKind === 'card' && e.modified > 0) out.add('playerHit');
        break;
      case 'HeavyHit': out.add('heavyHit'); break;
      case 'BlockGained': if (e.target === 'player') out.add('block'); break;
      case 'Healed': if (e.target === 'player') out.add('heal'); break;
      case 'RhythmChanged': if (rhythm == null || e.value > rhythm) { if (e.value > 0) out.add('rhythmUp'); } rhythm = e.value; break;
      case 'Riposte': case 'GhostRiposte': out.add('riposte'); break;
      case 'GhostGuard': out.add('block'); break;
      case 'PlayerStunned': out.add('stun'); break;
      case 'GhostPhase': out.add('roundBell'); break;
      case 'RoundEnd': out.add('roundBell'); break;
      case 'MinionSummoned': out.add('minionSummon'); break;
      case 'StatusApplied':
        if (e.target === 'enemy' && e.effectId === 'stun') out.add('stun');
        if (e.target === 'player' && DEBUFFS.has(e.effectId)) out.add('debuff');
        break;
      case 'Died': out.add(e.who === 'enemy' ? 'ghostDeath' : 'playerDeath'); break;
    }
  }
  if (out.has('heavyHit')) out.delete('playerHit');
  if (out.has('ghostDeath')) { out.delete('playerHit'); out.delete('heavyHit'); }
  return [...out];
}

const DEBUFFS = new Set(['stun', 'fear', 'poison', 'curse', 'corruption', 'entangle', 'weakness', 'vulnerable', 'draw_reduction']);
