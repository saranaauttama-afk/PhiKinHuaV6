# Battle follow-up — v1.0.11 / code 12

Branch: work/occupation-table. Approved on 2026-10-06 after v1.0.10 physical-phone screenshots.

## Changes

- Helpers use 42 px source-clipped heads, 52×48 touch cells, 10 px gaps, and a small remaining-turn badge. Each instance remains separate, including duplicates. Player helpers sit immediately above the player HUD; enemy helpers are inside the enemy HUD. Horizontal scrolling preserves target size. All nine existing images are preserved; no new bitmap assets. Tap opens a wood detail modal with the actual name, duration and ability descriptions; no permanent name/effect captions.
- Enemy wood HUD contains name/HP, actual block, current turn/side and statuses. No future intent. Removed the floating turn/block labels. Enemy card front/back retain ragged paper but have no rectangular border.
- Battle pile view uses the existing woven-mat background and two-column DeckCard art. Grouped counts, all four piles, exhausted details and full CardRow mechanics remain available. Draw remains grouped/sorted by name, never revealing draw order.
- Close, Android back and attempted route removal open a pause menu. Pause settles presentation callbacks only; it never calls CompleteNode/Proceed. Settings and resume remain in the fight. Returning to main menu explicitly saves the settled combat state and RNG; playing on the same screen preserves the battle, while cold-start Continue restores the same enemy, hand/piles, helpers, player stats, flags, turn and unresolved map node. No StartCombat rerun. A failed save keeps the player in pause. New game still goes to class selection.
- Added engine guards so Proceed/CompleteNode cannot advance combat, reward/upgrade or defeat states. Existing victory completion paths still work. Ordinary V2 map checkpoints remain compatible; explicit battle snapshots add battleRng. Queued/in-flight older autosaves finish before explicit suspension to prevent checkpoint overwrite.

## Validation

TypeScript, 551 tests across 34 files, diff checks and web export passed before push. Four regressions cover exact battle serialization and next enemy resolution with saved RNG, no unfinished node advancement, rejection of victory suspension, and detached restored state. Android smoke now checks pause/settings/resume, woven-mat piles/details, main-menu return, force-stop/cold restore with identical hand/enemy HP, hardware back, and real helper effect/details. APK/native results pending CI. Prior v1.0.10 APK does not contain these changes.
