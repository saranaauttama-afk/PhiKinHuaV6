# Battle follow-up — v1.0.11 / code 12

Branch: work/occupation-table. Approved on 2026-10-06 after v1.0.10 physical-phone screenshots.

## Changes

- Helpers use 42 px source-clipped heads, 52×48 touch cells, 10 px gaps, and a small remaining-turn badge. Each instance remains separate, including duplicates. Player helpers sit immediately above the player HUD; enemy helpers are inside the enemy HUD. Horizontal scrolling preserves target size. All nine existing images are preserved; no new bitmap assets. Tap opens a wood detail modal with the actual name, duration and ability descriptions; no permanent name/effect captions.
- Enemy wood HUD uses the shared decor layer above the portrait so the ghost cannot cover the turn label. It contains name/HP, actual block, current turn/side and statuses. No future intent. Removed the floating turn/block labels. Enemy card front/back retain ragged paper but have no rectangular border.
- Battle pile view uses the existing woven-mat background and two-column DeckCard art. Grouped counts, all four piles, exhausted details and full CardRow mechanics remain available. Draw remains grouped/sorted by name, never revealing draw order.
- Close, Android back and attempted route removal open a pause menu. Pause settles presentation callbacks only; it never calls CompleteNode/Proceed. Settings and resume remain in the fight. Returning to main menu explicitly saves the settled combat state and RNG; playing on the same screen preserves the battle, while cold-start Continue restores the same enemy, hand/piles, helpers, player stats, flags, turn and unresolved map node. No StartCombat rerun. A failed save keeps the player in pause. New game still goes to class selection.
- Added engine guards so Proceed/CompleteNode cannot advance combat, reward/upgrade or defeat states. Existing victory completion paths still work. Ordinary V2 map checkpoints remain compatible; explicit battle snapshots add battleRng. Queued/in-flight older autosaves finish before explicit suspension to prevent checkpoint overwrite.
- JourneyTrail icon parents and scene/ghost wrappers remain mounted in the native hierarchy. This prevents Android Fabric image reparenting when a selected journey node changes border/opacity while entering combat.

## Validation

TypeScript, 551 tests across 34 files, diff checks and web export passed. Four regressions cover exact battle serialization and next enemy resolution with saved RNG, no unfinished node advancement, rejection of victory suspension, and detached restored state.

[APK build and full Android API 36 smoke passed](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37493232636), from app commit `115a8f838a2b0bba4328eaf2ed66f4a53037fc2d`. Native checks exercised ghost switching/deselection and entry, pause/settings/resume, woven-mat pile/card details, main-menu return, force-stop/cold restore with identical hand/enemy HP, hardware back, real card play and enemy turn, victory before rewards, rest/event travel, and actual helper details/duration/damage (3 to 2 turns; enemy HP 30 to 26). Physical device not tested. Prior v1.0.10 APK does not contain these changes.

[Download v1.0.11 APK](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37493232636/artifacts/11426118774) (artifact ZIP). Package `com.phikinhua.episode`, version code 12, minSDK 24, ARM64/x86_64. Signature and 16 KB ELF/ZIP alignment audits passed. Signing certificate SHA-256 remains `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`. APK SHA-256: `528121d8f6112ae9d750a861d2d1a5a7721a9a54a0470210fb91af1a5f2c33ec`.

The final overlay correction rebuilds the production JavaScript/Hermes bundle with the identical dependency lock and native/asset source. The signed APK reuses the full Gradle native build from run 37486347510. SHA-256 verification pins that base APK; the audit compares all 1,184 non-bundle native, DEX, manifest and resource entries byte-for-byte, checks matching Hermes bytecode versions and the original signing certificate, and repeats full native UI smoke on the final APK. The normal full Gradle workflow remains available.

[Final native screenshots and runtime evidence](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37493232636/artifacts/11427157560). Visually inspected the compact helper head above the player HUD, its tap-only details, woven-mat pile cards, and the complete enemy turn/block row rendered above the ghost portrait. The smoke also verifies the same hand and enemy HP after main-menu suspension, force-stop and Continue; all runtime assertions passed on the final APK.
