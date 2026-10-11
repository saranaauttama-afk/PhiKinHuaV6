# B17 — Three-page adventure implementation contract

Issue: #6. Branch: work/adventure-pages-b17, forked from work/battle-ui-backlog-v22.

## Confirmed baseline (source audit)
- `app/index.tsx` currently renders `state.pages.current.offers` and dispatches `ChooseOffer` by index.
- Combat offers currently switch the entire page UI to `SceneGhostChoices` when *any* combat offer exists; mixed shop/ghost offers need independent per-offer rendering (B13).
- `src/core/map/pages` owns page offers; `src/core/map/restPage.ts` and `journeySync.ts` govern rest/advance. Study reducers and serialization before changing shape.
- `app/journeyLocations.ts` has 15 presentation locations. Preserve existing assets and migrate to chapter/zone progression rather than random backwards movement.

## Required behavior
1. Three independent slots; a selected encounter resolves only its own slot, and a replacement arrives according to the encounter deck rules.
2. Players can postpone a shop or healing page and return while it remains visible; visiting must not accidentally launch combat.
3. Next Intersection postpones visible ghosts into a finite queue and discards visible optional services after confirmation. Ghosts return after undiscovered encounters; all must be fought. Story-critical pages and boss gates cannot be bypassed.
4. Each night is a complete independent run with the same entire ghost roster, a night-specific story and a different final boss. Nights 2–5 increase difficulty. Night five continues into ผีกินหัว.
5. Include all 28 existing non-final ghosts once per night (17 normal, six elite, five legacy guardians), 12 finite optional services and one mandatory story. Count resolved encounters and queued ghosts; never refill defeated ghosts or spent services.
6. Combat primarily rewards money/XP. Cards come primarily from shops, chests, events and rare choices; never auto-grant a card every victory.
7. Persist encounter pool, slots, resolved state, RNG/seed and night progress. Existing saves must migrate safely or fail with an explicit recoverable message.
8. Maintain the Thai pulp horror presentation and geographically consistent scene selection. Reuse existing artwork.
9. Test independent slot replacement, postponed shop/well, Next Intersection, story/boss gates, save/load, all five nights and final boss, and mobile interactions.

## Implementation sequence
- Read `src/core/map/pages`, reducer, `restPage`, `journeySync`, store persistence and their tests.
- Introduce pure encounter-deck/page transition logic with deterministic tests before UI changes.
- Render all three encounter types together (do not branch whole screen based on existence of a combat offer).
- Add balancing and scene migration after functional page flow.
- Build/test APK only after verified end-to-end run; no completion claims before tests.

## User corrections authorized 2026-10-10 (Bangkok)
- Battle: enlarge upper body; crop lower body at the enemy HUD. Played card beside its owner’s shoulder/chest.
- Map: full-body ghosts dominate smaller props; common ground and text baselines.
- Status detail: one old-paper panel, existing illustrated seals, readable effect/duration.
- Treasure: real deck-card face with inspection and explicit รับการ์ด confirmation.
- Equipment: inspect even when poor; confirm/cancel; charge and remove stock only after confirmation.
- Reuse every existing image; no newly generated artwork. Old short-route saves may be discarded.
- No free HP refill before the ultimate boss; late deferred fights must retain resource pressure.
