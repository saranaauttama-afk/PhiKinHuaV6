# Paper Diorama production rollout

Integration branch: `work/paper-diorama-rollout`. No merge to main.

**Status:** rollout implementation and functional checks are complete. Android smoothness is not signed off: the software-rendered emulator shows slow frames, and physical-device/real-time visual review remains pending. The supplied APK is for that review.

## Baseline audit

`main` (`98bda80839e10e6428ab83d3de37657fc890e234`) → `work/hand-balance-v33` (`3d76e9ed3cd557a57392abe12e32a197efac1268`) → approved prototype (`1dc7a4e29ebce6f44dfef5b3356f785f805b6a77`). Both comparisons are ahead-only, seven commits each. Integration starts at the latest v33 gameplay baseline and fast-forwards the existing prototype; no ambiguous gameplay conflicts. Engine, card definitions, equipment, blessings, save migration, campaign and difficulty rules are preserved byte-for-byte.

The latest v33 baseline starts fresh runs with two energy, two opening cards, two draws per turn and two retained normal cards. Excess normal cards require explicit discards before the enemy acts; the QA victory card occupies no retention slot. The first-guardian choice raises draw or retention independently to three. Explicit combo state, completion bonuses, combo HUD/book and combo metrics stay removed. Existing v32 saves keep their legacy hand/draw values and their idempotent v33 migration. All of these rules are integrated unchanged.

## Milestone 1

Production village route and battle use the approved paper renderer and Settings switch. Entry identity is independent of turn updates; battle geography is frozen for the lifetime of the fight, including rewards. Shared values perform the three-second assembly without per-frame React state. HUD remains a screen-space sibling, and interaction is blocked until assembly finishes.

A configurable 4% requested downward shift adjusts the floating character's ground reference. The shift is limited when necessary to keep the entire cutout eight pixels above the enemy HUD. Short screens cannot accommodate a full 4% shift without changing the approved HUD; the actual permitted shift is smaller. The original art, natural aspect ratio and negative floating offset are preserved.

Inventory audit: 24 distinct environment images under `assets/scence/journey/thai-v24`: 16 primary locations including the secret throne, and eight rest locations. Episode aliases reuse five of those assets. Menus, character selection, chapter illustrations and reward mats are UI/story artwork outside route/battle geography and will remain unchanged.

Validation: TypeScript and all 930 unit tests passed. Production save-resume/discard/next-turn checks are run at 360×640 and 393×852 before this milestone is pushed.

## Milestone 2 — environment coverage

24/24 registered environments. The village retains the approved layered bitmaps. The other 23 use scene-specific vector contour clips of their existing paintings, a full static original background, translucent stationary ink underlays, independent distant/terrain/foreground prints, depth-specific ink widths and modest cast shadows. The terrain print registers to the local ground plane; the static background and distant print keep the original field of view. No flattened-image zoom, raster regeneration or new village copies.

Grounded/floating placement is chosen independently by ghost ID. The original dangling-foot prototype and marsh lights, flying krahang and krasue float; human-body revenants use ground contact. Configuration remains presentation-only. Legacy full-body route choices and battle art use the same scene ground reference; the current three-page encounter portrait layout is retained.

| ID | Location | Environment | Implementation |
|---|---|---|---|
| `01-village` | หมู่บ้านใต้จันทร์ | village | Approved 4-layer village |
| `02-village-edge` | ท้ายหมู่บ้าน | village | Original painting + 3 independent contour prints |
| `03-temple-gate` | ประตูวัดร้าง | temple | Original painting + 3 independent contour prints |
| `04-temple-court` | ลานโบสถ์ร้าง | temple | Original painting + 3 independent contour prints |
| `05-cremation-ground` | ป่าช้าเก่า | forest | Original painting + 3 independent contour prints |
| `06-bamboo-forest` | ดงไผ่ไร้เสียง | forest | Original painting + 3 independent contour prints |
| `07-banyan` | ไทรพันวิญญาณ | forest | Original painting + 3 independent contour prints |
| `08-stream` | ลำธารเงาดำ | riverside | Original painting + 3 independent contour prints |
| `09-waterfall` | น้ำตกหุบลับ | riverside | Original painting + 3 independent contour prints |
| `10-mountain-trail` | ทางเขาหมอก | mountain | Original painting + 3 independent contour prints |
| `11-mountain-shrine` | ศาลข้างทางเขา | mountain | Original painting + 3 independent contour prints |
| `12-cave-mouth` | ปากถ้ำฟันหิน | cave | Original painting + 3 independent contour prints |
| `13-cave-river` | แม่น้ำใต้พิภพ | cave | Original painting + 3 independent contour prints |
| `14-buried-sanctuary` | สำนักร้างในถ้ำ | cave | Original painting + 3 independent contour prints |
| `15-otherworld-gate` | ประตูแดนอาถรรพ์ | otherworld | Original painting + 3 independent contour prints |
| `16-secret-throne` | แดนผีกินหัว | otherworld | Original painting + 3 independent contour prints |
| `rest-02` | ศาลาพักริมนา | village | Original painting + 3 independent contour prints |
| `rest-04` | ศาลาข้างวัด | temple | Original painting + 3 independent contour prints |
| `rest-06` | กระท่อมดงไผ่ | forest | Original painting + 3 independent contour prints |
| `rest-08` | ศาลาริมน้ำ | riverside | Original painting + 3 independent contour prints |
| `rest-10` | ศาลาพักทางเขา | mountain | Original painting + 3 independent contour prints |
| `rest-12` | กระท่อมปากถ้ำ | cave | Original painting + 3 independent contour prints |
| `rest-14` | แท่นพักในถ้ำ | cave | Original painting + 3 independent contour prints |
| `rest-15` | ศาลาหน้าแดนอาถรรพ์ | otherworld | Original painting + 3 independent contour prints |

Preserved artwork: all original ghost, card, HUD, blessing, equipment and scene bitmaps. Modified artwork files: **none**. New visual data: authored vector cut contours/scene and character registrations. Menu, class-selection, chapter illustrations and reward mats are preserved and excluded from route/battle geography.

The vector contours represent major paper scenery shapes; they are not a repaint or a newly illustrated set of leaf-by-leaf transparent bitmaps. Original paper relief can reveal deliberate seams where terrain is repositioned; those seams require manual visual approval, especially river/cave layers.

Milestone 2 verification: TypeScript passed; 956 unit tests passed across 52 files; 64 paper browser checks passed (48 scene/viewport route→battle checks, 14 normal-speed representative assembly checks, two reduced-motion/persistence checks), with no browser errors. Grounded/floating placement is tested for all 34 catalogued ghosts in every environment across five viewport sizes and safe-area variants. Production v33 mobile checks (12) and three-night/five-tier UI checks (44) also passed. Static bitmaps are unchanged.

Browser timing is collected under software rendering and includes screenshot overhead: it is not a physical-device FPS guarantee. World prints are memoized and their native transforms request hardware texture caching; Android memory/frame stats are collected in the final APK job.

## Changed implementation files

Relative to the approved prototype, changes are confined to:

- Production integration: `app/index.tsx`, `app/battle.tsx`, `app/scenePresentation.ts`, `app/components/SceneArrival.tsx`, `app/components/SceneGhostChoices.tsx`, `app/components/ShopView.tsx`, `app/components/StoryEventView.tsx`, `app/components/battle/BattleBackdrop.tsx`, `app/components/battle/MonsterArea.tsx`.
- Paper rendering/registration: `app/components/paper/SceneTheater.tsx`, `PaperEnvironment.tsx`, `PaperActor.tsx`, `PaperDiorama.tsx`, `app/paperSceneAssets.ts`, `src/visual/paperEnvironments.ts`, `src/visual/paperPlacement.ts`.
- Review/verification: `app/paper-environments-review.tsx`, `scripts/paper-rollout-check.cjs`, `scripts/android-paper-rollout-smoke.py`, `test/paper-rollout.test.ts`, placement/viewport tests, `.github/workflows/paper-rollout.yml`, this report and the preserved-artwork checksum manifest.

## Final Android validation

The final review build uses the existing full game entry, package `com.phikinhua.episode`, test signing key, version code 35, offline JS/assets, arm64-v8a and x86_64, with signature and 16KB native-library/ZIP checks. The test-only environment review route and existing QA helper are enabled; gameplay data and save format remain v33.

The Android job installs that exact artifact into an API 36 portrait emulator. It checks actual campaign entry, route/battle transition, cold save resume, absence of combo UI, seven representative environments at logical 360×640 and 393×852, normal-speed assembly recording, late HUD, OFF persistence and reduced-motion override. Native memory/frame statistics and crash logs are retained. This is emulator testing; physical phone performance and final visual approval remain manual review of the supplied APK.

The existing combat hit-shake is forwarded to the independently rendered ghost cutout; its original timing and distance are retained. Additional legacy browser harnesses now tap exposed card corners (matching the existing overlapping hand) and wait for blessing image measurement before checking equal sizes. The UI/card geometry is unchanged.

Opening-frame review caught overly opaque ink underlays on the expanded scenes. They now use 16% opacity so the original full-coverage painting remains visible from the first frame rather than presenting a large solid dark region. The independently moving prints and final ink contours remain sharp.

## Milestone commits

| Milestone | Commit | Result |
|---|---|---|
| 1 — latest gameplay integration and village placement | `4cb663538780980c6011d43040a77dc52471208b` | Existing prototype integrated on v33, route/battle entry and configurable floating shift |
| 2 — all existing environments | `465b4a553f3164282de86eae3326c570192f10d2` | 24 environment registrations and independent paper prints |
| 3 — mobile, performance and signed build verification | `d31acad67bdce9e4dd3d91f89c4c00802152d8f4` onward | Functional regression and packaging passed; Android smoothness approval remains pending |

An Android activity-recreation check exposed a restored-combat redirect before the root navigator was ready. `app/index.tsx` retries on the next animation frame until the navigator is ready, and verifies that the current route is still home before redirecting. The retry is cancelled when the home effect unmounts or its state/path changes. This also prevents a background home screen from redirecting over the test review route. Combat state and save progression are unchanged. The native regression repeats the original saved-combat window recreation before environment review.

Episode geography aliases also resolve to the registered environments: `crossroads` → `01-village`, `lantern` → `rest-02`, `village` → `02-village-edge`, `shrine` → `rest-04`, `house` → `05-cremation-ground`.

The final navigation-only update uses an incremental Android build. Gradle compiles the current branch's production JS into Hermes bytecode; verified native libraries, manifest, resource table, assets and non-signature metadata are reused from the full build at `6811a6fe0a5a7f4da92ccd6573c908a4691ed99e`. Source guards reject any native/dependency/asset/gameplay/other-JS changes. ZIP entry hashes must show exactly one changed application entry, `assets/index.android.bundle`, excluding signature files. The APK is aligned again, signed with the same test certificate, and its install/signature/16KB checks are repeated.

## Manual review

Download the APK artifact ZIP and extract `PhiKinHua-Paper-Rollout-Test.apk`. It is a full-game offline test build, signed with the standard test key. The existing QA victory helper is enabled, and normal card/hand rules remain v33. Start or continue a run to review normal route and battle transitions. The test review route uses an isolated reducer snapshot and does not overwrite campaign progress.

For a direct temple review on a connected test device:

```sh
adb shell 'am start -W -a android.intent.action.VIEW -d "phikinhua://paper-environments-review?sceneId=03-temple-gate&ghostId=phi-pop" com.phikinhua.episode'
```

For the adjusted floating village ghost, use `sceneId=01-village&ghostId=phi-nang-yai`. Other scene IDs are listed in the coverage table. Assembly starts after choosing the ghost and pressing the existing encounter button. Use the existing Settings screen to switch **แอนิเมชันฉากกระดาษ** ON/OFF.


## Final test results and immutable build

| Check | Result | Evidence |
|---|---|---|
| TypeScript | Passed | Source verification job `114564070908` |
| Unit tests | **956/956, 52 files** | Same verified application source |
| Approved bitmap checksums | **101/101 unchanged** | 69 ghost images + 24 environment paintings + 8 approved prototype images |
| Mobile web | **226 checks passed** | 360×640 and 393×852; paper 64, v33 12, campaign/difficulty 44, backlog 42, adventure 26, archive 12, final tuning 26 |
| Android functional/visual | **20 checks passed on the exact signed APK** | Campaign/save resume + window recreation + 14 representative environment/viewport entries + normal-speed recording + OFF persistence + reduced motion + crash/worklet checks |
| Android performance | Measured; smoothness gate pending | API 36 emulator, logical 393×852; detailed frame/memory results below |
| APK packaging | Passed | V2/V3 signature, test certificate, offline Hermes bundle/assets, portrait manifest, arm64-v8a/x86_64, 16KB native/ZIP alignment, installation |

The Android checks are combined from run `38173301137` (17 successful checks) and the completed settings follow-up run `38174850144` (three successful checks). The first run's OFF assertion sampled 700ms after an adb tap while the emulator still displayed the route selection, so it did not compare battle frames. The follow-up identifies battle entry in recorded frames by ghost position and disappearance of the route button, then compares the first four battle HUD samples with the completed scene. Both runs install the exact same APK SHA-256; this test correction does not change application code. Raw records, video and comparison metadata are retained in the two audit artifacts.

OS reduced-motion emulation, settings persistence, next-entry ON/OFF behavior and no replay on combat turns/re-enabling are also covered by the web paper harness. Native tests separately confirm the persisted game reduced-motion setting overrides ON. Hardware phone checks remain manual.

- Verified application source: `9cadcf501c563ec6ceb65c166e74998bcf21a408`.
- APK build source: `1e786da13fdfaa924c632e0bd485b0e0b6fd9f52`; application inputs are byte-identical to the verified source. Later commits contain test scripts, workflows, reports and review media only.
- APK: `PhiKinHua-Paper-Rollout-Test.apk`, version `1.0.33` / code `35`.
- APK SHA-256: `1466491cd3f0f183fd2e72645f4784d92f44c2750563ae2efc173310575bff14`.
- Signing certificate SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c` (standard Android test certificate).

[Source verification](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38171204621/job/114564070908) · [signed APK build](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38172779690/job/114568722461) · [native settings pass](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38174850144).

## Downloads and visual review

- [Signed test APK artifact ZIP](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38172779690/artifacts/11714652340) — extract the APK before installation.
- [Signature/package/alignment evidence](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38172779690/artifacts/11714472789).
- [Complete mobile web screenshots, traces and recordings](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38171204621/artifacts/11713049921) — all 24 environments at both portrait sizes, first/middle/final frames and three normal-speed representative recordings.
- [Android representative screenshots and normal-speed temple recording](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38173301137/artifacts/11715176820).
- [Android OFF/reduced-motion recordings and persistence results](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38174850144/artifacts/11715751421).

GitHub artifact downloads require an authenticated account with repository access. The APK artifact is retained until November 10, 2026. Representative images, smaller normal-speed MP4 copies and machine-readable combined results are also preserved under [`docs/paper-rollout-review`](paper-rollout-review) in this integration branch.

## Complete rollout file list

Relative to the approved prototype, the following application/registration/test files changed. Delivery adds the performance/media workflow and generated review evidence under `docs/paper-rollout-review`; existing artwork paths have no changes.

- `.github/workflows/paper-rollout-native-recheck.yml`
- `.github/workflows/paper-rollout.yml`
- `app/battle.tsx`
- `app/components/SceneArrival.tsx`
- `app/components/SceneGhostChoices.tsx`
- `app/components/ShopView.tsx`
- `app/components/StoryEventView.tsx`
- `app/components/battle/BattleBackdrop.tsx`
- `app/components/battle/MonsterArea.tsx`
- `app/components/paper/PaperActor.tsx`
- `app/components/paper/PaperDiorama.tsx`
- `app/components/paper/PaperEnvironment.tsx`
- `app/components/paper/SceneTheater.tsx`
- `app/index.tsx`
- `app/paper-environments-review.tsx`
- `app/paperSceneAssets.ts`
- `app/scenePresentation.ts`
- `docs/PAPER-ROLLOUT.md`
- `docs/paper-rollout-artwork-sha256.json`
- `scripts/adventure-mobile-check.cjs`
- `scripts/android-paper-rollout-smoke.py`
- `scripts/backlog-mobile-check.cjs`
- `scripts/paper-rollout-check.cjs`
- `src/visual/paperEnvironments.ts`
- `src/visual/paperPlacement.ts`
- `test/paper-placement.test.ts`
- `test/paper-rollout.test.ts`
- `test/paper-viewport.test.ts`



## Measured performance

Web assembly traces at both portrait sizes: 14 normal-speed entries, mean frame interval **16.52–16.56 ms**, p95 **16.8–17.2 ms**, worst **23.4 ms**. These are browser animation-frame intervals, not Android render timings. Traces include screenshot/entry overhead; assembly remains a configured three-second animation.

Android API 36 uses Google SwiftShader software rendering. A fresh exact-APK installation was measured across seven consecutive environment entries, without screen-recording overhead. FrameCompleted − IntendedVsync timings show substantial delay/jank in this emulator. **This does not pass a smoothness claim and must be checked on a physical phone before approval/merge.** The software-rendering result cannot establish how fast a phone GPU will render, and it also cannot be used to dismiss the observed delay.

| Scene | Sampled frames | Mean completion time (ms) | p95 (ms) | PSS (MiB) |
|---|---:|---:|---:|---:|
| 01-village | 29 | 284.6 | 400.1 | 151.1 |
| 03-temple-gate | 40 | 223.1 | 266.8 | 164.7 |
| 06-bamboo-forest | 44 | 202.9 | 250.2 | 181.6 |
| 08-stream | 46 | 191.5 | 216.9 | 192.0 |
| 10-mountain-trail | 49 | 191.3 | 225.6 | 201.5 |
| 13-cave-river | 47 | 187.5 | 216.9 | 199.9 |
| 16-secret-throne | 48 | 184.8 | 217.0 | 208.4 |

PSS ranges from **151.1 to 208.4 MiB** during this single pass. A sequence of cached environments is not a long-run leak test. All seven entries remained responsive enough to finish and showed no native/JS/worklet crash; the collection job validates functioning/sample availability, not an FPS threshold.

[Raw native performance audit](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38175805734/artifacts/11715867859) · [combined machine-readable results](paper-rollout-review/verification.json) · [additional full TypeScript/unit/mobile verification](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38175147417).

## Representative media

- [Normal-speed temple assembly — mobile web](paper-rollout-review/web-assembly-03-temple-gate.mp4).
- [Normal-speed bamboo forest assembly — mobile web](paper-rollout-review/web-assembly-06-bamboo-forest.mp4).
- [Normal-speed cave river assembly — mobile web](paper-rollout-review/web-assembly-13-cave-river.mp4).
- [Actual signed-APK temple assembly — Android emulator](paper-rollout-review/native-assembly-temple.mp4).
- [Seven environments at logical 360×640](paper-rollout-review/environments-720.jpg) and [393×852](paper-rollout-review/environments-786.jpg).
- Full-size examples: [floating village ghost](paper-rollout-review/battle-01-village-720.jpg), [grounded temple ghost](paper-rollout-review/battle-03-temple-gate-786.jpg), [cave river](paper-rollout-review/battle-13-cave-river-786.jpg).

## Known visual/performance limits

- No device is connected here. API 36 portrait emulator installation and functional checks passed; performance on a physical Android phone is still for manual review.
- Normal-speed native and browser recordings plus per-frame web traces are retained. The available playback surface timed out during review, so real-time playback review could not be completed in this environment. Representative stills and timed-frame assertions were inspected; manual normal-speed playback/visual approval remains pending.
- Original paintings are reused as vector-clipped paper prints. Major contour cuts and ground-plane seams, particularly rivers/caves, need the requested visual approval. No leaf-by-leaf artwork regeneration was performed.
- The requested 4% floating-ghost adjustment is constrained on short screens to preserve the complete artwork and existing HUD. The full shift is not forced when it would overlap the HUD.
- Emulator frame timings include software rendering and entry work. They are evidence of measured behavior, not a phone FPS guarantee. Native frame timings are recorded without the screen-recording overhead in the performance job.
- This is a signed test build with the existing QA victory helper and isolated environment review route enabled. It is not a store release.

Implementation milestones and verification evidence are committed and pushed to the integration branch; the Android smoothness gate remains open. Main, v33 and the approved prototype branch remain unchanged. No automatic merge is performed. Stop here for manual APK and visual approval.
