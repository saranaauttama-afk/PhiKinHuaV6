import {V33_HAND_BALANCE} from '../../balance/core';
// src/core/engine/handlers/run.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { baseNewState } from '../../commands';
import { rollTwoBlessings } from '../../level';
import { START_ENERGY } from '../../balance/core';
import { initPageMap } from '../../map/pages';
import {startAdventure} from '../../map/adventure';
import { getClass, buildStarterDeck } from '../../classes';
import { grantBlessing } from '../shared';
import { fireChapter } from '../../story/chapters';
import { getEquipmentById } from '../../pack';

// Auto-equip equipment cards from starting deck and remove equipped cards from deck
function autoEquipStartingCards(s: GameState) {
  if (!s.masterDeck) return;

  const equipmentCards = s.masterDeck.filter(card => card.type === 'equipment');
  const equippedCardIds: string[] = [];
  
  for (const card of equipmentCards) {
    if (!card.equipmentId) continue;
    
    // Get equipment data from pack
    const equipmentData = getEquipmentById(card.equipmentId);
    if (!equipmentData) continue;
    
    // Check if we have slot space
    const currentSlotUsage = (s.equipped || []).reduce((sum, eq) => sum + (eq.slotCost || 1), 0);
    const maxSlots = s.equipmentSlotsMax || 1;
    const cardSlotCost = card.slotCost || equipmentData.slotCost || 1;
    
    if (currentSlotUsage + cardSlotCost <= maxSlots) {
      // Check if this equipment is not already equipped
      const alreadyEquipped = (s.equipped || []).some(eq => eq.id === card.equipmentId);
      if (!alreadyEquipped) {
        // Auto-equip the equipment
        s.equipped = s.equipped || [];
        s.equipped.push({
          id: equipmentData.id,
          name: equipmentData.name,
          rarity: equipmentData.rarity,
          slotCost: equipmentData.slotCost,
          desc: equipmentData.desc,
          tags: equipmentData.tags,
          sourceCardId: card.id, // Track which card this came from
          sourceCard: { ...card } // Keep full card data for returning later
        } as any);
        
        // Mark card for removal from deck
        equippedCardIds.push(card.id);
        
        s.log = s.log || [];
        s.log.push(`Starting equipment: ${equipmentData.name || equipmentData.id}`);
      }
    } else {
      // Put excess equipment in backpack
      const equipmentData = getEquipmentById(card.equipmentId);
      if (equipmentData) {
        const alreadyInBackpack = (s.backpack || []).some(eq => eq.id === card.equipmentId);
        if (!alreadyInBackpack) {
          s.backpack = s.backpack || [];
          s.backpack.push({
            id: equipmentData.id,
            name: equipmentData.name,
            rarity: equipmentData.rarity,
            slotCost: equipmentData.slotCost,
            desc: equipmentData.desc,
            tags: equipmentData.tags
          });
          
          s.log = s.log || [];
          s.log.push(`Equipment in backpack: ${equipmentData.name || equipmentData.id}`);
        }
      }
    }
  }

  // Remove equipped equipment cards from masterDeck
  if (equippedCardIds.length > 0) {
    // Remove only the first instance of each equipped card
    const remainingDeck: typeof s.masterDeck = [];
    const toRemove = [...equippedCardIds];
    
    for (const card of s.masterDeck) {
      const removeIndex = toRemove.indexOf(card.id);
      if (removeIndex !== -1) {
        toRemove.splice(removeIndex, 1); // Remove from removal list (only remove first occurrence)
      } else {
        remainingDeck.push(card);
      }
    }
    
    s.masterDeck = remainingDeck;
    s.log = s.log || [];
    s.log.push(`Removed ${equippedCardIds.length} equipped card(s) from deck`);
  }
}


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
  s.turnFlags.equipmentOnce = {};

  // ── คลาสกำหนดค่าสถานะตั้งต้นและเด็ค
  // เดิมทุกรันใช้ START_DECK ชุดเดียวกันหมด เล่นรอบสองจึงเหมือนรอบแรก
  const cls = getClass(cmd.classId);
  s.classId = cls.id;
  s.player.maxHp       = cls.startHp;
  s.player.hp          = cls.startHp;
  s.player.maxEnergy   = cls.startEnergy;
  s.player.energy      = cls.startEnergy;
  s.player.maxHandSize = cls.startHandSize;
  {s.player.maxEnergy=s.player.energy=V33_HAND_BALANCE.energy;s.player.openingDraw=V33_HAND_BALANCE.openingDraw;s.player.drawPerTurn=V33_HAND_BALANCE.drawPerTurn;s.player.maxHandSize=V33_HAND_BALANCE.retainedHand;s.player.handBalanceVersion=33;}

  const { ALL_CARDS } = require('../../pack');
  const deck = buildStarterDeck({...cls,starterDeck:Object.fromEntries(Object.entries(cls.starterDeck).map(([id,count])=>[id,Math.min(2,count)]))}, ALL_CARDS);
  if (deck.length > 0) {
    s.masterDeck = deck;
  } else {
    // การ์ดของคลาสหาย — ใช้เด็คกลางไว้ก่อนดีกว่าเริ่มรันด้วยเด็คว่าง
    const { START_DECK } = require('../../balance/core');
    s.masterDeck = JSON.parse(JSON.stringify(START_DECK));
    s.log.push(`ไม่พบการ์ดของคลาส ${cls.name} ใช้เด็คกลางแทน`);
  }

  // ✅ Equipment defaults
  s.equipmentSlotsMax = 1;
  s.equipped = s.equipped ?? [];
  s.backpack = s.backpack ?? [];

  // ✅ Auto-equip equipment cards from starting deck
  autoEquipStartingCards(s);

  s.mapMode = 'pages';
  s.pages = initPageMap();

  // Starter blessing
  s.levelUp = null;
  const bb = rollTwoBlessings(r, (s.blessings ?? []).map(b => b.id)); r = bb.rng;
  if(s.campaign?.unlocks.includes('blessing'))bb.list.push(require('../../campaign/nights').SPECIAL_BLESSINGS[cls.id]);
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
  s.player.energy = s.player.maxEnergy ?? START_ENERGY;
  return { state: s, rng: r };
}
