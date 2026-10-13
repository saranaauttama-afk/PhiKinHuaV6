// src/core/map/pages.ts — offers shown on the three-slot adventure board.
import type { Adventure } from './adventure';

export type PageOffer =
  | { kind: 'monster', tier: 'normal' | 'elite', enemyId: string }
  | { kind: 'shop_card'; shopId: string }
  | { kind: 'shop_equipment'; shopId: string }
  | { kind: 'shop_remove'; shopId: string; phase: 1 | 2 }
  | { kind: 'shop_upgrade'; shopId: string; phase: 1 | 2 }
  | { kind: 'well'; shopId: string }
  | { kind: 'healing_shrine'; shopId: string }
  | { kind: 'blessing'; shopId: string }
  | { kind: 'treasure'; shopId: string }
  | { kind: 'treasure_single'; shopId: string }
  | { kind: 'story_event'; shopId: string; eventId: string }
  | { kind: 'next_event' }
  | { kind: 'boss', bossType: 'final' | 'secret', enemyId: string };

export type MapStatePages = {
  adventure?: Adventure;
  /** Encounters consumed this night (resolved + skipped). */
  pageIndex: number;
  current?: { offers: PageOffer[]; resolved: boolean[] };
  _activeOfferIndex?: number;
  _shopUsed?: boolean;
};

export function initPageMap(): MapStatePages {
  return { pageIndex: 0 };
}

/** Non-combat stops: can be passed by without fighting. */
export function isRestOfferKind(kind: PageOffer['kind']): boolean {
  return kind.startsWith('shop_') || kind === 'well' || kind === 'healing_shrine' ||
    kind === 'treasure' || kind === 'treasure_single' || kind === 'story_event' || kind === 'blessing';
}
