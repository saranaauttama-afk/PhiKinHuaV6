import {CARD_RULES} from '../../balance/notfm';
// src/core/engine/handlers/run.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { baseNewState } from '../../commands';
import { rollTwoBlessings } from '../../level';
import { initPageMap } from '../../map/pages';
import {startAdventure} from '../../map/adventure';
import { getClass, buildStarterDeck } from '../../classes';
import { grantBlessing } from '../shared';
import { fireChapter } from '../../story/chapters';

export function newRun(
  s: GameState,
  cmd: Extract<Command, { type: 'NewRun' }>,
  r: RNG
) {
  s = baseNewState(cmd.seed);
  // Every run is the three-night campaign. Difficulty defaults to the first tier.
  const difficulty=cmd.difficulty&&Number.isInteger(cmd.difficulty)&&cmd.difficulty>=1&&cmd.difficulty<=5?cmd.difficulty:1;
  s.campaign={night:1,difficulty,completedNights:0,unlocks:[...new Set(cmd.unlocks??[])]};
  s.blessings = s.blessings ?? [];
  s.turnFlags = s.turnFlags ?? { blessingOnce: {} };
  s.runCounters = { removed: 0, removeShopCount: 0, upgradeShopCount: 0 };

  const cls = getClass(cmd.classId);
  s.classId = cls.id;
  s.player.maxHp = s.player.hp = cls.startHp;
  s.player.startMana = cls.startMana;
  s.equipmentSlotsMax = CARD_RULES.equipmentSlots;
  s.equipped = [];
  const { CARD_LIST_WITH_STARTERS } = require('../../pack');
  s.masterDeck = buildStarterDeck(cls, CARD_LIST_WITH_STARTERS);

  s.mapMode = 'pages';
  s.pages = initPageMap();

  // Starter blessing
  s.levelUp = null;
  const bb = rollTwoBlessings(r, (s.blessings ?? []).map(b => b.id)); r = bb.rng;
  if(s.campaign?.unlocks.includes('blessing'))bb.list.push(require('../../pack').classBlessing(cls.id));
  s.starter = { choices: bb.list, consumed: false };
  s.phase = 'starter';

  // บทเปิดเรื่องของคลาส — ขึ้นก่อนหน้าเลือกพร เพื่อให้รู้ว่ากำลังเล่นเป็นใคร
  // และออกเดินทางเพราะอะไร ก่อนจะถูกถามว่าจะเอาพรอะไรติดตัว
  fireChapter(s, { kind: 'prologue', classId: cls.id });

  return { state: s, rng: r };
}

export function chooseStarter(
  s: GameState,
  cmd: Extract<Command, { type: 'ChooseStarterBlessing' }>,
  r: RNG
) {
  if (s.phase !== 'starter' || !s.starter || s.starter.consumed) {
    return { state: s, rng: r };
  }
  const b = s.starter.choices[cmd.index];
  if (b && grantBlessing(s, b)) {
    s.log.push(`Starter blessing: ${b.name ?? b.id}`);
  }
  s.starter = null;

  r = startAdventure(s, r);

  s.phase = 'map'; // UI ของคุณใช้ phase 'map' เพื่อโชว์ pages อยู่แล้ว
  s.enemy = undefined;
  s.player.block = 0;
  s.player.ap = s.player.maxAp;
  return { state: s, rng: r };
}
