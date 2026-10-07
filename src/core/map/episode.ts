import type { JourneyMap, RowPlan } from './journey';
import type { PageOffer } from './pages';
import { EPISODE } from '../balance/episode';

/** A compact authored route using the existing encounter handlers. */
export function buildEpisode(): JourneyMap {
  const offers: PageOffer[][] = [
    [{ kind: 'monster', tier: 'normal', enemyId: 'phi-pop' },
     { kind: 'monster', tier: 'normal', enemyId: 'nang-tanee' }],
    [{ kind: 'story_event', shopId: 'episode_lantern', eventId: EPISODE.eventId },
     { kind: 'shop_equipment', shopId: 'episode_equipment' }],
    [{ kind: 'monster', tier: 'normal', enemyId: 'phi-krasue' },
     { kind: 'monster', tier: 'normal', enemyId: 'phi-nang-ram' }],
    [{ kind: 'healing_shrine', shopId: 'episode_shrine' },
     { kind: 'shop_upgrade', shopId: 'episode_upgrade', phase: 1 },
     { kind: 'story_event', shopId: 'episode_blessing', eventId: 'episode_blessing' }],
    [{ kind: 'monster', tier: 'elite', enemyId: 'phi-pong-kang' }],
  ];
  const plans: RowPlan[] = [
    { kind: 'fight', fightIndex: 1 }, { kind: 'rest' },
    { kind: 'fight', fightIndex: 2 }, { kind: 'rest' },
    { kind: 'fight', fightIndex: 3 },
  ];
  const rows = offers.map((row, i) => row.map((_, c) => `e${i}_${c}`));
  const nodes: JourneyMap['nodes'] = {};
  offers.forEach((row, i) => row.forEach((offer, c) => {
    const id = rows[i][c];
    nodes[id] = { id, row: i, col: c, offer, next: rows[i + 1] ?? [] };
  }));
  return { nodes, rows, plans, rowIndex: 0 };
}
