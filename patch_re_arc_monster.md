# Monster Card System Re-Architecture Plan

## Overview
สร้าง Monster Card System ใหม่หมดเพื่อแทนที่ระบบเก่าที่มีปัญหา Architecture โดยระบบใหม่จะแยกออกจาก AI system เดิมและมุ่งเน้นการเล่นการ์ดแบบ Sequential (ทีละใบ) พร้อม Animation

## Problems with Current System
1. **Architecture Conflict**: ระบบเก่าเป็น AI bot ที่เล่นการ์ดพร้อมกันทันที ไม่ใช่ Card System ที่เล่นทีละใบ
2. **State Synchronization**: React gameState และ Game Engine state ไม่ sync กัน
3. **Energy Management**: Energy system ไม่ทำงานถูกต้อง (แสดง 0 ตลอด)
4. **Card Display**: Monster cards แสดงเป็น "undefined" เพราะ hand มี string ID แต่ UI ต้องการ card objects
5. **Animation Issues**: Animation เล่นพร้อมกันแทนที่จะเล่นทีละใบตามลำดับ

## New Architecture Design

### 1. Core Monster Card System (`src/core/monsterCardSystem.ts`)
```typescript
export interface MonsterCardConfig {
  id: string;
  name: string;
  tier: 'normal' | 'elite' | 'boss';
  cardSystem: {
    enabled: boolean;        // เปิด/ปิด card system สำหรับ monster นี้
    handSize: number;        // ขนาดมือ
    maxEnergy: number;       // พลังงานสูงสุด
    energyPerTurn: number;   // พลังงานที่ได้ต่อเทิร์น
    deckSize: number;        // ขนาดเด็ค
    cardPool: string[];      // การ์ดที่สามารถใช้ได้
  };
  animation: {
    cardFlipDuration: number;     // เวลาพลิกการ์ด
    cardExecuteDuration: number;  // เวลาดำเนินการ
    betweenCardDelay: number;     // เวลาหน่วงระหว่างการ์ด
  };
}

export class MonsterCardSystem {
  // จัดการ deck, hand, discard, energy
  // เล่นการ์ดทีละใบตามลำดับ
  // แยกจาก AI system เดิมสมบูรณ์
}
```

### 2. Monster Configurations
กำหนดค่าสำหรับ monster แต่ละตัว:
- **phi-krasue**: handSize=3, maxEnergy=3, cards=['krasue_claw', 'krasue_guard', 'krasue_swipe', 'krasue_brace']
- **shadow-warrior**: handSize=4, maxEnergy=4, cards=['shadow_strike', 'shadow_block', 'shadow_dash', 'shadow_guard']
- **disabled monsters**: cardSystem.enabled=false (ใช้ AI เดิม)

### 3. Sequential Card Playing Flow
1. **Start Turn**:
   - Reset energy = energyPerTurn
   - Draw cards to handSize
   - Sort cards by priority (attacks first, then by energy cost)

2. **Prepare Sequence**:
   - Filter playable cards (enough energy)
   - Create playQueue array
   - Set isPlayingCards = true

3. **Execute Sequence**:
   - Play cards one by one with timing delays
   - Each card: flip animation → execute effect → move to discard
   - Use advanceCardSequence() to move to next card

4. **End Turn**:
   - Discard remaining hand
   - Set isPlayingCards = false

### 4. Integration Points

#### A. Combat Handler Integration
```typescript
// src/core/engine/handlers/combat.ts
import { initializeMonsterCardSystem, getCurrentMonsterCardSystem } from '../../monsterCardSystem';

export function start(s: GameState, cmd: Extract<Command, { type: 'StartCombat' }>, r: RNG) {
  startCombat(s, cmd.monsterId, r);

  // Initialize monster card system
  const result = initializeMonsterCardSystem(s, cmd.monsterId, r);
  r = result.rng;

  return startPlayerTurn(s, r);
}

export function endTurn(s: GameState, _cmd: Extract<Command, { type: 'EndTurn' }>, r: RNG) {
  // ... existing code ...

  const monsterSystem = getCurrentMonsterCardSystem();
  if (monsterSystem?.isCardSystemEnabled()) {
    monsterSystem.startTurn();
    const playQueue = monsterSystem.prepareCardSequence();

    if (playQueue.length > 0) {
      // Set up sequential monster turn
      (s as any).monsterSequentialTurn = {
        active: true,
        queue: playQueue,
        currentIndex: 0,
        timer: Date.now()
      };
    }
  } else {
    // Use old AI system for non-card monsters
    runEnemyTurn(s);
  }

  return { state: s, rng: r };
}
```

#### B. Battle UI Integration
```typescript
// app/battle.tsx
const monsterSystem = getCurrentMonsterCardSystem();
const monsterHand = monsterSystem?.getHandForDisplay() || [];

// Monster card display
{monsterHand.map((item, index) => (
  <Animated.View key={item.cardId} style={[cardStyle]}>
    <Image
      source={isCardRevealed ? getCardImage(item.card) : bgMonsterCardBackMini}
      style={cardImageStyle}
    />
  </Animated.View>
))}

// Sequential card playing
const playNextMonsterCard = useCallback(async () => {
  const monsterSystem = getCurrentMonsterCardSystem();
  if (!monsterSystem) return;

  const nextCard = monsterSystem.getNextCardToPlay();
  if (!nextCard) {
    // End monster turn
    dispatch({ type: 'StartPlayerTurn' });
    return;
  }

  // Play card with animation
  await playMonsterCardAnimation(nextCard);

  // Execute card effect
  dispatch({ type: 'MonsterPlayCard', cardId: nextCard });

  // Advance to next card
  monsterSystem.advanceCardSequence();

  // Continue sequence
  setTimeout(() => playNextMonsterCard(), monsterSystem.getConfig().animation.betweenCardDelay);
}, []);
```

#### C. New Command Types
```typescript
// src/core/types.ts
export type Command =
  | { type: 'MonsterPlayCard'; cardId: string }
  | { type: 'StartPlayerTurn' }
  // ... existing commands
```

### 5. Implementation Steps
1. ✅ **Design Architecture** - Complete
2. 🔄 **Create MonsterCardSystem class** - In progress
3. ⏳ **Integrate with combat handlers**
4. ⏳ **Update Battle UI for sequential play**
5. ⏳ **Test with phi-krasue**
6. ⏳ **Add more monster types**

### 6. Benefits of New Architecture
- **Clean Separation**: Monster Card System แยกจาก AI system
- **Extensible**: เพิ่ม monster ใหม่ได้ง่าย
- **Configurable**: แต่ละ monster มี config ของตัวเอง
- **Animation Friendly**: Support sequential card playing
- **Backward Compatible**: Monster เก่าใช้ AI system ต่อได้

### 7. Next Steps After Exercise
1. สร้างไฟล์ `src/core/monsterCardSystem.ts` ตาม design ข้างบน
2. แก้ไข `combat.ts` handler เพื่อใช้ระบบใหม่
3. อัพเดท `battle.tsx` UI สำหรับ sequential animation
4. เทสกับ phi-krasue
5. เพิ่ม monster types อื่นๆ

## Technical Notes
- ระบบเก่า (AI) และระบบใหม่ (Card) จะทำงานแยกกัน
- Monster ที่มี `cardSystem.enabled = false` จะใช้ AI เดิม
- ระบบใหม่จัดการ state ของตัวเองใน MonsterCardSystem class
- UI จะได้ card data ที่ถูกต้องจาก getHandForDisplay()
- Animation timing ควบคุมใน monster config