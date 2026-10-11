import type { CardData, GameState } from '../types';

export const TEST_WIN_CARD_ID = 'qa_phra_prathan';
// Expo replaces this literal env lookup in the test APK bundle. Normal builds stay unchanged.
export function testWinCardEnabled(): boolean {
  return process.env.EXPO_PUBLIC_TEST_WIN_CARD === '1';
}
export function dealTestWinCard(s: GameState): void {
  if (!testWinCardEnabled() || s.phase !== 'combat' || s.turn !== 1) return;
  if ([...s.piles.hand, ...s.piles.draw, ...s.piles.discard, ...s.piles.exhaust].some(c => c.id === TEST_WIN_CARD_ID)) return;
  const card: CardData = {
    id: TEST_WIN_CARD_ID, instanceId: `${TEST_WIN_CARD_ID}:${s.fightCount ?? 0}`,
    name: 'พระประธาน', type: 'skill', cost: 0, rarity: 'Legendary', exhaust: true,
    desc: 'การ์ดทดสอบ · ชนะการต่อสู้นี้ทันที รวมถึงบอส แล้วรับรางวัลตามปกติ',
    tags: ['test-only'],
  };
  // An extra first-hand card: never replaces a normal class starter card.
  s.piles.hand.unshift(card);
}
