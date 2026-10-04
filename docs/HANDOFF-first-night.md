# Handoff — first playable night (2026-10-04)

## Audited starting state

- Read README from `main` and technical/design documents from the latest branch. `forCodex` had no README, AGENTS.md or explicit handoff file. `CLAUDE.md`, `context.md`, game-rule documents and current source were cross-checked rather than treated as fresh state.
- Latest engineering tip: `forCodex` `0cd4dc4aabde2410be9c3d46a8d1a2577f7e4238`; default `main` was older (`c7be1d2`). Work branch is `work/first-chapter-apk`.
- Most recent existing Actions run `35974764087` succeeded, artifact `10798877235` (24 Sep 2026). Downloaded and inspected the actual APK: `com.phikinhua.app`, 1.0.0 / code 1, minSDK 24, targetSDK 36, ARM64/ARMv7/x86/x86_64, v2 signed. Signing certificate SHA256 `FAC61745DC0903786FB9EDE62A962B399F7348F0BB6F899B8332667591033B9C`. ARM64 ELF load segments and uncompressed ZIP entries align to 16 KB.
- The old APK's exact device install failure cannot be determined without Package Installer/adb error from that device. The earlier first workflow failed at PNG resource processing, then the JPEG fix built successfully; that build issue does not establish the cause of a later device install failure.
- Baseline: 526 tests and TypeScript passed before edits.

## Changes

- Separate install identity `com.phikinhua.episode`, version 1.0.1 / code 2, signed standalone offline APK, ARM64+x86_64. Avoids collisions with the old app/signature/save data. Still uses the Expo test signing key; production key management is future work.
- Authored three-fight route with two short rests, a visible objective, explicit risk/card/heal lantern decision, mutually exclusive healing/upgrade before a 54 HP finale, and a chapter ending. Episode HP: 30 / 36 / 54; finale enemy energy 3. Normal full-run rules remain behind the existing mode default.
- Episode enemy card IDs are planned before player decisions and used unchanged at enemy turn. Damage estimates refresh after player debuffs, with UI stating limitations (block/status/traps).
- Hand cards support tap → readable details → explicit use, with drag still supported. Controls and ink frames restyled, contrast improved; existing class/monster illustrations reused.
- Two imagegen assets created, checked and connected: village JPEG and transparent Krasue PNG. Chapter/event illustrations share the location; existing rest art is reused. See `first-night-art.md` for prompts.
- Automatic save when entering combat now checkpoints the prior map decision rather than an entered node with combat state removed. Midcombat manual saves remain legacy behavior; use autosave to resume this episode safely. No claim of complete full-game save-system audit.
- Added episode engine tests: real-card simulations for 8 seeds × 4 classes, actual rewards/ending, committed intent, save round-trip, all route ghosts wired. These are reachability/balance checks, not proof of human enjoyment.
- Added Actions APK identity/signature/offline bundle/16KB checks plus a real API 36 emulator install-and-UI smoke with screenshots/logs.

## Verification at implementation time

- All 534 tests passed (31 files). Typecheck and Android/web export are checked before the implementation commit; final results below are updated after CI.
- Emulator and physical-device results are separate: no physical device has been tested by the assistant.
- CI build/install/UI smoke: pending the implementation push. Do not infer success from this document until the actual run status is recorded.

## Remaining user playtest

1. Download/extract the APK itself (do not attempt to install the artifact ZIP). Allow APK installs from the downloading app and install the separate FirstNight app.
2. Try a new chapter with the shaman, then optionally another class. Time a complete playthrough, including reading and reward decisions.
3. Check Thai text, notch/navigation insets, tap/drag cards, damage/intent clarity, rewards, lantern choice and finale. Verify reopening uses autosave at the last map decision.
4. Report the exact installer error if installation fails, and device model/Android version. APK auditing alone cannot diagnose device policies or Package Installer rejection.

## Next scope

Only expand after feedback on this chapter: measure 5–10 minute pacing, decision quality, perceived tension/rewards, sprite size and UI readability. Bots can win often with strong defense; novice difficulty and fun need human playtesting. Do not start making the other 50+ art slots or resume Refinery as part of this task.
