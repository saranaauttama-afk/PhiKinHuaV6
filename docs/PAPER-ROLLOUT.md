# Paper Diorama production rollout

Integration branch: `work/paper-diorama-rollout`. No merge to main.

## Baseline audit

`main` (`98bda808`) → `work/hand-balance-v33` (`3d76e9ed`) → approved prototype (`1dc7a4e`). Both comparisons are ahead-only, seven commits each. Integration starts at the latest v33 gameplay baseline and fast-forwards the existing prototype; no ambiguous gameplay conflicts. Engine, card definitions, equipment, blessings, save migration, campaign and difficulty rules are preserved byte-for-byte.

## Milestone 1

Production village route and battle use the approved paper renderer and Settings switch. Entry identity is independent of turn updates; battle geography is frozen for the lifetime of the fight, including rewards. Shared values perform the three-second assembly without per-frame React state. HUD remains a screen-space sibling, and interaction is blocked until assembly finishes.

A configurable 4% requested downward shift adjusts the floating character's ground reference. The shift is limited when necessary to keep the entire cutout eight pixels above the enemy HUD. Short screens cannot accommodate a full 4% shift without changing the approved HUD; the actual permitted shift is smaller. The original art, natural aspect ratio and negative floating offset are preserved.

Inventory audit: 24 distinct environment images under `assets/scence/journey/thai-v24`: 16 primary locations including the secret throne, and eight rest locations. Episode aliases reuse five of those assets. Menus, character selection, chapter illustrations and reward mats are UI/story artwork outside route/battle geography and will remain unchanged.

Validation: TypeScript and all 930 unit tests passed. Production save-resume/discard/next-turn checks are run at 360×640 and 393×852 before this milestone is pushed.

## Milestone 2 — environment coverage

24/24 registered environments. The village retains the approved layered bitmaps. The other 23 use scene-specific vector contour clips of their existing paintings, a full static original background, stationary ink underlays, independent distant/terrain/foreground prints, depth-specific ink widths and modest cast shadows. The terrain print registers to the local ground plane; the static background and distant print keep the original field of view. No flattened-image zoom, raster regeneration or new village copies.

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
