# 🎮 PhiKinHuav6 - Universal Card System Migration Roadmap

## 📋 Project Overview
Night of the Full Moon-like card game with Thai ghost theme. Migrating from legacy card system to Universal Card System to resolve duplicate card ID issues and improve architecture.

## ⚠️ Core Problem Statement
- **Primary Issue**: Player cards with duplicate IDs cause multiple cards to play simultaneously
- **Secondary Issue**: Monster cards using string arrays instead of objects, causing duplicate identification problems
- **Root Cause**: Legacy system uses cardId for identification instead of unique instance IDs

## 🎯 Solution: Universal Card System
Instance-based card identification system where each card has:
- `instanceId`: Unique identifier (e.g., "player_strike_1234567890_001")
- `cardId`: Base card type (e.g., "strike", "krasue_claw")
- `owner`: Entity owner ("player", "phi-krasue", etc.)

---

## 🚀 Implementation Status

### ✅ Phase 1: Core Architecture (COMPLETED)
1. **Universal Type System** - `src/core/unified/completeTypes.ts`
   - UniversalCard interface with instanceId, cardId, owner
   - GameEntity with unified stats and piles
   - EnergySystem and StatusEffect definitions
   - All core types for universal system

2. **Card Factory System** - `src/core/unified/universalCardFactory.ts`
   - Creates universal cards for players and monsters
   - Converts legacy CardData to UniversalCard
   - Generates unique instance IDs with timestamp
   - Fixed import cycle issues with dynamic imports

3. **Game Manager** - `src/core/unified/universalGameManager.ts`
   - Complete game state management
   - Turn-based system with proper AI execution
   - Card playing with instance-based identification
   - Entity management (player, monsters)

4. **Migration Layer** - `src/core/unified/migrationLayer.ts`
   - Gradual transition from legacy to universal system
   - Backward compatibility maintained
   - Activates only for specific monsters (phi-krasue, phi-pop, phi-krahang)
   - Intercepts PlayCard and EndTurn commands

### ✅ Phase 2: Combat Integration (COMPLETED)
1. **Combat Handlers** - `src/core/engine/handlers/combat.ts`
   - Integrated migration layer interceptors
   - Universal system initialization on combat start
   - Dual system support (legacy + universal)

2. **UI State Hooks** - `src/core/unified/useUniversalState.ts`
   - React hooks for universal player/enemy state
   - Card conversion utilities for UI display
   - Real-time state synchronization with polling

3. **Battle UI Update** - `app/battle.tsx`
   - Updated to use universal system hooks
   - Player and monster card displays use convertUniversalCardsForUI
   - Card playing through playUniversalCard function
   - Turn management via endUniversalTurn

### ✅ Phase 3: Bug Fixes (COMPLETED)
1. **Import Cycle Resolution**
   - Replaced static imports with dynamic requires
   - Fixed cardById function missing in pack.ts
   - Resolved circular dependency issues

2. **RNG System Compatibility**
   - Fixed rng() vs rng.next() vs next(rng) usage
   - Updated shuffleCards and getRandomCardFromHand functions
   - Proper RNG state management in pile operations

---

## 🔄 Current Status: Testing Phase

### 🧪 Phase 4: System Testing (IN PROGRESS)
**Current Task**: Testing unified system with phi-krasue battle

**Activation Conditions**:
- Universal system activates ONLY for: `phi-krasue`, `phi-pop`, `phi-krahang`
- Other monsters continue using legacy system
- Controlled rollout to minimize risk

**Testing Checklist**:
- [ ] Combat initialization without errors
- [ ] Player cards display correctly
- [ ] Card playing works with instance IDs
- [ ] No duplicate card execution
- [ ] Monster AI functions properly
- [ ] Turn progression works
- [ ] Combat ending/victory handled

---

## 📊 System Impact Analysis

### 🟢 Systems NOT Affected (Safe):
- **Shop System**: Uses gameState.gold and gameState.piles directly
- **Equipment System**: Uses gameState.equipped separately
- **Treasure System**: Adds cards to gameState.piles.discard
- **Blessing System**: Uses gameState.blessings[] independently
- **Card Upgrade**: Modifies cards in gameState.piles
- **Card Remove**: Deletes from gameState.piles
- **Save/Load**: Works with existing gameState structure

### 🟡 Systems Partially Affected:
- **Combat with phi-krasue**: Uses universal system
- **Combat with other monsters**: Uses legacy system
- **Battle UI**: Detects which system to use automatically

---

## 📅 Next Steps Roadmap

### 🔥 Immediate (Current Session)
1. **Complete phi-krasue Testing**
   - Fix remaining runtime errors
   - Verify no duplicate card playing
   - Test full combat flow
   - Confirm system switching works

### 📋 Phase 5: Remaining Tasks (Next Sessions)
1. **TypeScript Compilation Cleanup**
   - Fix remaining TS errors in legacy code
   - Resolve type mismatches
   - Clean up unused imports

2. **System Expansion** (Optional)
   - Add more monsters to unified system
   - Implement advanced card mechanics
   - Add card targeting system

3. **Performance Optimization**
   - Replace polling with event-based state updates
   - Optimize card conversion functions
   - Reduce memory footprint

### 🎯 Future Considerations
1. **Full Migration** (Major Update)
   - Migrate all monsters to unified system
   - Remove legacy system entirely
   - Update save file format

2. **Advanced Features**
   - Multi-target card effects
   - Conditional effects system
   - Equipment card integration

---

## 🛠️ Technical Notes

### Key Files Modified:
```
src/core/unified/
├── completeTypes.ts          # Universal type definitions
├── universalCardFactory.ts   # Card creation and conversion
├── universalGameManager.ts   # Game state management
├── migrationLayer.ts         # Legacy compatibility
└── useUniversalState.ts      # React hooks

src/core/engine/handlers/
└── combat.ts                 # Combat system integration

src/core/
├── pack.ts                   # Added cardById function
└── rng.ts                    # RNG utilities

app/
└── battle.tsx                # Updated UI components
```

### Architecture Decisions:
1. **Gradual Migration**: Ensures stability during transition
2. **Instance-based IDs**: Prevents duplicate card issues permanently
3. **Backward Compatibility**: Legacy code continues working
4. **Minimal UI Changes**: Same user experience, better internals

### Known Issues:
1. Some TypeScript compilation errors in non-critical files
2. RNG system requires careful state management
3. Import cycles resolved but monitoring needed

---

## 🎮 How to Continue Work

### When Opening New Session:
1. **Read this roadmap first** to understand current status
2. **Check current phase** in Implementation Status
3. **Run the game** and test phi-krasue battle
4. **Look at Next Steps** for what to work on next

### Testing Commands:
```bash
npx expo start          # Start development server
# Navigate to game -> Select phi-krasue -> Test combat
```

### Key Debug Logs:
- `[Migration] Initializing unified mode` - Universal system activated
- `[UniversalGM] Initializing combat` - Game manager started
- `Universal card played successfully` - Card system working

### Git Status:
- Current branch: `updateUI`
- Latest commits include universal system implementation
- Safe to experiment - git backup available

---

## 📞 Contact Points

**For Next Developer/Session:**
- This roadmap contains complete context
- Focus on Phase 4: System Testing first
- Don't create new systems until current one is stable
- Ask user about priorities before major changes

**User Concerns Addressed:**
- ✅ Won't affect shop, equipment, treasure, blessing systems
- ✅ Git backup available, no additional backup needed
- ✅ Focused approach to complete current work

---

*Last Updated: 2025-09-15*
*Status: Testing Phase - Universal System with phi-krasue*