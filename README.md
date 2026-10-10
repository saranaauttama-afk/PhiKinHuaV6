# ผีกินหัว — ห้าคืนอาถรรพ์

## Current branch: v1.0.30 / Android code 31

User-approved framed encounter layout: three matching illustrated dark panels, equal circular ghost/service portraits, short public trait clues and an in-panel confirmation button. The selected frame uses red ink; Next Intersection is compact and still confirms skipped services. Map HUD height is reduced with its deck/blessing actions preserved. Local TypeScript, 753 tests and web export passed; new mobile/Android verification and APK are pending. See `docs/HANDOFF-framed-encounters-v30.md`.

## Previous delivery: v1.0.29 / Android code 30

`work/final-tuning-v29` implements Issue #7: ten distinct route ghosts per night plus the night boss (night five also has the ultimate boss), two new roster ghosts each later night, four spaced service opportunities, richer owner-specific enemy decks, real dodge/thorns mechanics, simpler HUDs and corrected shared encounter illustrations. TypeScript, 753 automated tests and 320 seeded simulations passed locally without stalled runs. The simulation still shows class balance differences, especially faster shaman fights; human pacing/fun is not signed off. Signed APK/package audit and native five-night validation passed in CI 38043198980. The existing 82 mobile checks passed; the added final-tuning script failed because its selector matched two same-label controls. v30 corrects that selector and replaces the encounter layout. See `docs/HANDOFF-final-tuning-v29.md`.

## Previous verified delivery: v1.0.28 / Android code 29

Adds the approved บันทึกอาถรรพ์ archive: all 34 ghosts grouped and numbered, all 126 class cards plus curses/fusion/QA categories, real durable discovery/victory tracking, search/filters, locked and full views, and read-only card upgrade inspection. TypeScript, 710 tests and 82 mobile UI checks passed. Signed offline APK v1.0.28 / code29 built and verified; five-night native archive validation passed in CI 38017307432 / job 114113941819. See docs/HANDOFF-archive-v28.md.

## Previous verified delivery: v1.0.27 / Android code 28

Continuing Issue #6 on `work/adventure-pages-b17`, with the user’s corrected full-run design. Every night contains the same complete 28-ghost roster, one mandatory story, 12 finite preparation pages and its own final boss; night five continues to ผีกินหัว (29/30 battles). Next Intersection queues ghosts for later and consumes skipped optional rest opportunities. All queued ghosts must be cleared before the boss. Later nights increase difficulty, and each run traverses the complete geographic route. Old short-route saves may be discarded.

Corrected paper status details, enlarged upper-body battle ghosts and owner-relative reveals, full-body map ghosts with smaller props, actual treasure cards with confirmation, and equipment inspection/confirm/cancel. No existing artwork regenerated or changed. TypeScript, 699 automated tests, web export, final Android build and package audit passed. The corrected UI harness passed 70 mobile checks on application-identical commit `7e16b2e`; API 36 native verification completed all five nights and 146 battles with all 28 route ghosts each night. The first final-build UI job failed on fixture hydration timing; its corrected rerun passed. Test APK retains พระประธาน for structural testing. Exact current validation is in `docs/HANDOFF-adventure-pages-b17.md`; older APK evidence there is historical.

Expo 54 / React Native 0.81 / React 19 / TypeScript card roguelike. Five nights have distinct bosses; night five adds the mandatory game-original ผีกินหัว. All 34 ghosts, 134 newly illustrated card assets, 16 blessings and 24 rural Thai journey environments share vintage Thai horror comic art. Player-card and blessing hashes detect accidental duplicates; enemy move cards intentionally reuse their owner's portrait.

## Historical releases

The following notes describe earlier implementations and validation, not the current branch state.

## Latest battle UI follow-up

`work/occupation-table`: **v1.0.18/code 19** adds ordered starter combos to all four classes, real card-reading decisions, enemy budget search and visible escalation every third round. Starting decks and three reward lanes now support four distinct builds. Fixes live turn counting, enemy poison/status expiry, conditional draw and free-card cost. TypeScript, 576 tests and production web export passed; 640 seeded chapter simulations distinguish random play from public-board tactics. APK/native CI is pending. See `docs/HANDOFF-gameplay-v18.md`.

`work/occupation-table`: **v1.0.17/code 18** uses compact green/red status seals with tap-to-read details, a separate ghost HUD/art layout, opaque grayscale unplayable cards and faded selected discard cards. TypeScript, 566 tests and mobile web inspection passed. APK/native CI is pending. See `docs/HANDOFF-battle-status-v17.md`.

## Latest rest and difficulty pass

`work/occupation-table`: **v1.0.16/code 17** shows all rest activities in one row, enters them immediately and returns to the same rest location. Adds equipment and blessing opportunities, grows ghost budgets 2/3/4, enlarges illustrated enemy reveals and themes discard/ending screens. See `docs/HANDOFF-rest-pressure-v16.md`. [APK/native build](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37695923691) built the APK; its initial native smoke hit an outdated discard selector, corrected in commit `997d7db`.

## Latest gameplay pass

`work/occupation-table`: **v1.0.15/code 16** pilots warrior block/counter and strength/multiple-hit builds, medium spirit/poison builds, six new class cards, five real ghost signatures and 16 original card illustrations. Chapter rewards offer distinct attack/setup/engine options. The 160-run pilot uses real cards without hidden enemy-intent knowledge; 563 tests pass. Start a new run for the complete starter balance. [Verified APK/native build](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37658871240). See `docs/HANDOFF-chapter-builds.md` and `docs/card-art-prompts-v15.json`.

## Latest UI follow-up

`work/occupation-table`: **v1.0.14/code 15** adds explicit level-up card selection with before/after results, fixes native rest destination widths, themes upgrade/healing screens and removes the confusing delete-destination control. Episode map locations and battle arenas now use the actual route stage. See `docs/HANDOFF-level-rest-scenes.md`; APK/audit succeeded, but native resume smoke exposed an initially hidden dealt card; v1.0.15 fixes dealt-card visibility and keeps the exact resume comparison.

`work/occupation-table`: **v1.0.13/code 14** simplifies rest destinations to direct entry, shares a readable illustrated theme across level-up and story choices, and replaces story choices with the result in one panel. Local checks and mobile web interactions passed; APK audit and API 36 emulator smoke passed in run 37638483159. See `docs/HANDOFF-rest-flow.md`. The preceding v1.0.12 APK passed package audit and API 36 native smoke in run 37609561500.

`work/occupation-table`: **v1.0.11/code 12** replaces summoned-helper bodies with small head portraits above their owner HUD, consolidates enemy turn/block/statuses, removes enemy-card rectangles, updates battle piles to illustrated cards on the mat, and fixes close/back to pause with exact combat/RNG suspension. TypeScript, 551 tests, web export, APK audit and full Android API 36 smoke passed, including pause/settings, pile details, cold battle restore and actual helper damage. [Download verified v1.0.11 APK](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37493232636/artifacts/11426118774). See `docs/HANDOFF-battle-hud-pause.md`.

`work/occupation-table`: **v1.0.10/code 11** adds compact illustrated battle HUD/hand, sequential enemy-card presentation frames, and nine summoned-helper sprites with activity/expiry. TypeScript, all 547 tests, APK package/signature/16 KB audit and full Android API 36 native smoke passed. Battle/card/helper screenshots and native sequential enemy-turn video were inspected. [Download verified v1.0.10 APK](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37436044358/artifacts/11399588476). See `docs/HANDOFF-battle-cards-minions.md`.

`work/occupation-table`: **v1.0.9/code 10** presents protective blessings on a lantern-lit wooden shelf with symbolic art and tap-to-read details, uses เบี้ย/cowrie currency across the UI, and replaces the repeated primary-button lantern with a forward arrow. All 543 tests, TypeScript, APK audit and Android API 36 full native smoke passed; native cover/HUD/blessing/detail screens were visually inspected. [Download verified v1.0.9 APK](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37416831768/artifacts/11391163420). Read `docs/HANDOFF-blessing-cowrie.md` for assets/prompts and evidence.

`work/occupation-table`: **v1.0.8/code 9** puts ghosts directly in the scene with map-only full-body art and brightness selection, removes encounter paper/selection rectangles, and replaces the full-paper deck list with a woven-mat background, two-column symbolic cards and full tap-to-read details. All 543 tests, TypeScript, APK audit and Android API 36 full native smoke passed; native screens were visually inspected. [Download verified v1.0.8 APK](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37412767794/artifacts/11390855339). Read `docs/HANDOFF-scene-deck.md` for prompts/assets, behavior and validation.

`work/occupation-table`: **v1.0.7/code 8** implements the approved chalk/ink route icons, compact player HUD with actual class portrait and working deck/blessing links, and compact starter blessing screen from Backlog #4. All 543 tests, TypeScript, APK audit and Android API 36 full native smoke passed; native screens were inspected. [Download verified v1.0.7 APK](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37328381137/artifacts/11353947800). Read `docs/HANDOFF-map-hud.md` for details.

`work/occupation-table`: v1.0.6/code 7 implements the approved occupation detail mockup: portrait-only tabletop sheets, torn paper page, a lantern-lit temple background behind the existing character sprites and a crimson raster paper departure button. All 543 tests, TypeScript, APK audit and Android API 36 native smoke passed. All four class details and live actions were visually inspected. [Download verified v1.0.6 APK](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37272830307/artifacts/11329089015). Read `docs/HANDOFF-occupation-table.md` for current details.

`work/pulp-arrival-v3`: **v1.0.4/code 5** adds ritual map/battle UI: chalk slate route, torn ghost notices, protective cloth, wood enemy badges, palm-leaf cards and sacred-thread pot end-turn control. Native-parent preservation fixes an Android Fabric crash at victory transition. [Download verified APK](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37205064645/artifacts/11304288187). Read `docs/HANDOFF-ritual-ui.md` for exact validation and `docs/HANDOFF-pulp-ui.md` for v1.0.3 title/button/arrival work. Balance unchanged. Character notebook design stays in backlog issue #2.

## Current source

Current work branch: `work/final-tuning-v29`, continuing Issue #7. Read `docs/HANDOFF-framed-encounters-v30.md` for current UI and `docs/HANDOFF-final-tuning-v29.md` for gameplay; B17 documents below describe the older complete-roster design. `main` is older. Read `docs/HANDOFF-adventure-pages-b17.md` first; older references include `docs/HANDOFF-battle-hud-pause.md`, `docs/HANDOFF-blessing-cowrie.md`, `docs/HANDOFF-scene-deck.md`, `docs/HANDOFF-map-hud.md`, `docs/HANDOFF-occupation-table.md` and `docs/HANDOFF-first-night.md`; `CLAUDE.md` and `context.md` contain historical information and are not a reliable snapshot of current implementation. No AGENTS.md existed in the audited branch.

## Historical first chapter

Cover → character → short story → starter blessing → choose Pop/Tanee → lantern decision (heal, risky card, or pass) and equipment shop → choose Krasue/dancer → choose healing, card upgrade and blessing activities → Pong Kang finale → card reward and ending. Three real battles, with the existing reducer/command, equipment, class, card-reward and status systems. Rest nodes do not refill in this mode. Enemy cards stay face down until played; no enemy intent is displayed. The current chapter has dedicated enemy pressure and class-card balance.

Tap a hand card to read it and press **ใช้การ์ด**, or drag upward. End turn with **จบเทิร์น**. The old episode and full-run modes remain in the engine for legacy tests. The current main menu selects a class and one of five nights, using B17's finite adventure pages and optional card rewards.

## Run and check

```sh
npm ci
npm test
npx tsc --noEmit
npx expo start
npx expo export --platform android
npx expo export --platform web
```

`app/index.tsx` and `app/battle.tsx` are live routes, using `src/store/gameStore.ts`. Core changes go through `applyCommand`; balance for the episode is in `src/core/balance/episode.ts`. Assets are statically wired through `app/components/Art.tsx` and catalogued in `src/art/catalog.ts`.

## Android deliverable

GitHub Actions **Android five-night APK** builds a bundled offline, signed test APK with Expo's stable test/debug signing key. This is a test distribution, not a production signing setup. Application ID `com.phikinhua.episode`, current source version `1.0.28`, versionCode `29`, minSDK 24. ABI targets: ARM64 and x86_64. The APK retains the existing test-only พระประธาน card. See the current handoff for verified APK results and normal-card balance-pilot limits.

Actions verifies package metadata, APK signature, 16 KB native ELF/ZIP alignment and offline JS bundle. The Android API 36 x86_64 emulator test follows warrior through five nights, checks mixed shops and mandatory stories, 146 battles and six final/ultimate bosses, next-night unlocks, cold battle resume and cancelled drag. It uses พระประธาน to verify route structure; browser checks and the 320-run pilot independently exercise normal-card mechanics. The current branch uploads XML/JSON interaction reports, package audits and logcat without screenshots. The separate native verification workflow reuses an APK only after verifying its checksum and matching application source. See the handoff for actual run results; successful build alone does not prove installation or launch.

## Visual direction

Thai one-baht horror comics: heavy uneven black ink, faded flat colors, coarse printing, simple local silhouettes. The first chapter introduced village/Krasue art and reused matching class/ghost sprites. Subsequent pulp UI added the cover/icon/lantern scene and raster title/buttons. v1.0.4 adds seven original ritual raster assets in `assets/ui/ritual-*.png`. Prompt/source records: `docs/first-night-art.md`, `docs/HANDOFF-pulp-ui.md`, `docs/ritual-asset-prompts.json`.
