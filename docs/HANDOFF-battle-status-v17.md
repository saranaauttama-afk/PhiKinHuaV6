# v1.0.17 / Android 18 — compact battle effects and opaque disabled cards

Branch: work/occupation-table. Base: 997d7dbe30a6434b67ae7059d1782d34071abeb8.

## Behavior

- Player and ghost statuses use small circular seals: muted green buffs, muted red debuffs, with short Thai labels and stack counters. Classification still uses the real registry. One horizontally scrollable row cannot expand the HUD. Tap opens a modal with full name, description, stacks and remaining turns; back/backdrop/close dismiss it.
- Player traps and both pending/completed combos share that same row. Neutral prepared actions use earth-colored seals; details retain trigger/turn count or combo progress. Completed combos can now be inspected too.
- Enemy HUD occupies a separate full-width strip below the top controls. Enemy helper portraits occupy the spare top-left row. Ghost art starts below the bounded header and scales to leave room above the player HUD, including 360x640. Long HUD names remain on one line. Enemy-card anchoring uses the same layout.
- Unplayable hand cards use grayscale paper and art while staying opaque. This applies to insufficient energy, curses and enemy-turn locking. Reading an unaffordable card remains possible; playing/dragging it remains blocked. Played-card fade is retained.
- Selected discard cards fade to 40%; unselected cards remain fully visible even at the selection limit. Selected state, Thai label, selection cap, toggle and confirmation rules are preserved.
- Grayscale derivatives retain source alpha and ink detail. Regenerate with `python scripts/generate-card-gray.py` (Pillow). Source illustrations are unchanged.

## Validation

TypeScript, all 566 existing tests, final web export. Actual React Native web components rendered in Chromium at 393x852 and 360x640 with 9 status effects plus a combo. Inspected battle, status-detail and discard screenshots. Tested opening/closing status details, discard opacity 0.4 then 1 on toggling, and confirming the actual selected indices (0,2). Temporary QA route removed before delivery. Native APK audit/install/smoke remain separate CI results and must be reported when complete.

Prior v16 run 37695923691 built/audited its APK successfully; its native smoke failed at a stale discard selector. Base commit 997d7db already updates that selector and starts separate v16 verification. This change retains that update and increments the APK version and build audit filenames together.
