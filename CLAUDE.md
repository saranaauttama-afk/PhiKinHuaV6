# CLAUDE.md — PhiKinHuaV6 (ผีกินหัว)

Technical orientation for Claude Code sessions working in this repo. For game design discussion, redesign goals, and decision history, see `context.md` — that's the working doc for the "Night of the Full Moon" redesign conversation.

## What this is

A Thai-ghost-themed deck-building roguelike, mobile app (Expo/React Native). Structurally close to Slay the Spire (card combat, map with branching encounters, shops, relics/"blessings") but reskinned with Thai folklore ghosts (ผีกระสือ, กุมารทอง, แม่นาค, ฯลฯ) instead of the usual fantasy monsters. The dev's own spec (`gameRule/gameSpec.txt`) explicitly cites **Night of the Full Moon (月圆之夜)** as the visual/tonal reference — that's the redesign target, not a new idea being introduced.

## Stack

- **Expo 54 / React Native 0.81 / React 19**, routed with `expo-router`
- **TypeScript**, strict-ish, functional core
- **zustand** for the game store (`src/store/gameStore.ts` and a near-duplicate store inline in `app/index.tsx` — see Known Issues)
- **nativewind (Tailwind for RN)** + some raw `StyleSheet` — mixed usage, not fully migrated
- **moti / react-native-reanimated** for animation
- Fonts: `Prompt` (Thai-friendly UI font) and `Chakra Petch`, loaded via `@expo-google-fonts/*`. There's also a bundled Thai font `THSarabun` in `assets/fonts/` (license file present — DIP&SIPA font, check terms before shipping)
- No test framework configured. No lint config found at root — check before assuming `eslint`/`prettier` conventions.

Run locally: `npm install && npx expo start` (`--web` / `--android` / `--ios` variants in `package.json` scripts).

## Branches (as of last check)

- `main` — oldest, has `PATCH_NOTES.md`, `PHASE4_INTEGRATION_SUMMARY.md`, `TESTING_CHECKLIST.md` (not present on newer branches)
- `monster` — Thai Ghost Monster System introduction
- `updateUI` — battle system UI pass
- `animationComplete` / `updateBattle` — **most recent work**, identical HEAD commit ("Improve battle feedback and timing system"). This is what's currently checked out in the local clone at `/workspace/phikinhuav6`.

There is no branch that's clearly "current source of truth" beyond "most recently touched" — confirm with the user before assuming `animationComplete` supersedes `main` for anything not related to battle feedback/timing.

## Architecture

**Entry point**: `app/index.tsx` is where the real app lives — it defines its own zustand store inline (`makeEmptyState`, `Store` type, `shouldAutoSave`) and renders whichever screen component the app state points to (`StartPage`, `MapView`, `CombatView`, `ShopView`, `DeckView`, `EventView`, plus dialogs like `BlessingDialog`/`EncounterDialog`). `App.tsx` at repo root is the untouched Expo template — **dead code**, not the real entry (expo-router uses `app/index.tsx` via `app/_layout.tsx`).

**Core game logic** lives in `src/core/`, organized as a command/reducer pattern:
- `src/core/types.ts` — the central type definitions: `CardData`, `EnemyState`, `EquipmentData`, `GameState`, `DeckPiles`, etc. Start here to understand the data model.
- `src/core/engine/apply.ts` (re-exported via `src/core/reducer.ts`) — `applyCommand(state, command) → state`, the single state-transition function. All game actions (`CompleteNode`, `ChooseLevelUp`, `TakeShop`, `EventChooseBlessing`, `ChooseOffer`, `Proceed`, `ShopRemoveBuy`, `ShopUpgradeBuy`, combat actions, etc.) go through `Command` objects dispatched to this reducer.
- `src/core/map.ts`, `src/core/map/` — page/encounter/slot generation (3 slots per page, dynamic refresh, forced path-split — see `gameRule/GAME_RULES_DEVELOPER.md`)
- `src/core/monsters/thai-ghosts.ts` — the Thai ghost monster pool (tiers T1–T5, Elite, BossMid, BossFinal, SecretBoss — 31 monsters), deterministic per-fight selection
- `src/core/combat/`, `src/core/effectResolver.ts`, `src/core/statusEffectsRuntime.ts`, `src/core/cardComboSystem.ts` — combat resolution, status effects, card combos
- `src/core/blessing/`, `src/core/blessingRuntime.ts` — relic-equivalent "blessing" system
- `src/core/equipmentRuntime.ts`, `src/core/minionRuntime.ts`, `src/core/enemyBehaviorRuntime.ts`, `src/core/adaptiveAI.ts` — equipment, summons, enemy AI behavior
- `src/core/balance/`, `src/core/balance.ts` — tunable constants: EXP curve, gold curve, shop pricing, page-split thresholds. This is the intended single place to retune numbers (see `gameRule/GAME_RULES_DEVELOPER.md` → "Config / Tuning Points")
- `src/core/shop.ts`, `src/core/shopRegistry.ts` — shop stock, persistence/respawn logic
- `src/core/save.ts`, `src/core/storage.ts` — AsyncStorage-backed save slots + autosave on key commands
- `src/core/rng.ts` — seeded RNG (`makeRng`, `seedFromString`) — the run is meant to be seed-deterministic

**UI components**: `app/components/` holds the actual screen components in current use (`StartPage.tsx`, `MapView.tsx`, `CombatView.tsx`, `ShopView.tsx`, `DeckView.tsx`, `EventView.tsx`, `EncounterCard.tsx`, `EncounterDialog.tsx`, `BlessingDialog.tsx`, `Card.tsx`, `BtnEncounter.tsx`, plus `app/components/battle/` for combat sub-views). There's a second, mostly-unused `src/ui/components/` (`HUD.tsx`, `Hand.tsx`, `Panel.tsx`) and `src/ui/controllers/gameController.ts` — check whether these are dead before extending them; `src/ui/appState.ts` is currently an empty file.

**Design docs already in repo** (read these before proposing mechanical changes — they reflect deliberate, implemented decisions, not just aspiration):
- `gameRule/gameSpec.txt` — the original full design spec, explicitly "สไตล์ Night of the Full Moon". Covers run structure (15 fixed fights across 2 parts + optional secret boss), map/page system, the 31-monster Thai ghost pool and tier progression, EXP/gold curves, shop economy, and a checklist of what's implemented vs. TODO.
- `gameRule/GAME_RULES_PLAYER.md` — player-facing flow summary (Thai)
- `gameRule/GAME_RULES_DEVELOPER.md` — dev-facing flow/config summary (Thai), points at the exact tuning constants and file locations

## Current visual state (important for the redesign conversation)

Art assets are minimal/placeholder-grade right now:
- `assets/images/` — mostly UI chrome: card-back frames, HUD icons (`iHp`, `iBlock`, `iEnergy`, `iDeck`, `iMaxHand`), buttons. **No character or monster illustrations** beyond one (`assets/monsters/phi-krasue.png`).
- `assets/scence/` (sic — typo kept as-is in the actual folder name) — a handful of background scenes (`startPage.png`, `battleScence1.png`, `abandonedHut.png`, `swamp.png`)
- `assets/encounters/` — a few encounter-node icons (shop, treasure, well)
- `assets/imgBlessing/` — 2 blessing icons

So mechanically the game is fairly far along (full combat loop, map generation, shop, blessings, save system), but visually it's a functional gray-box, not yet styled toward the Night of the Full Moon look (painterly gothic-fairytale illustration, book/parchment framing, silhouette + warm-lamp lighting, restrained animated "living illustration" scenes). That gap is the redesign's starting point.

## Known issues / things to flag before touching

- **Duplicate store definitions**: `src/store/gameStore.ts` and the inline store in `app/index.tsx` look like near-copies (`makeEmptyState`, `shouldAutoSave`, same command list). Confirm which one is actually live before editing game-state logic — editing the wrong copy will silently do nothing.
- `App.tsx` at repo root is unused Expo boilerplate — don't confuse it with `app/index.tsx`.
- `src/ui/appState.ts` is empty (0 lines) — likely an abandoned refactor.
- Mixed Thai/English in code comments, card data, and doc files — this is the existing convention, not a mistake to "fix".
- No CI, no lint/test scripts wired up in `package.json` — verify changes manually via `expo start --web` or on-device.

## Working conventions for this repo

- Keep card/monster/event flavor text in Thai; keep code identifiers in English, matching existing style.
- Game balance numbers live in `src/core/balance*` — don't hardcode tuning values inline in components or reducers.
- New game actions should go through the `Command`/`applyCommand` pattern, not ad-hoc state mutation in components.
- This repo was added to the current session read/write-capable but has no pre-assigned branch/PR convention from the user — confirm branch name and whether to commit/push before making changes, same as any other repo.
