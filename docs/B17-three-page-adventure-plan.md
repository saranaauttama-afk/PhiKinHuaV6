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
3. Next Intersection may discard eligible unresolved slots, with a visible cost/tradeoff. Story-critical pages and boss gates must not be bypassed.
4. Each of five nights has a distinct encounter pool and story beat, its own boss, with a final boss after night five.
5. Start with a tunable 10–12 encounters/night; count actual resolved pages rather than fixed physical stops. Prevent infinite XP/gold farming via refills.
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
