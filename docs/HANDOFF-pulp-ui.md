# Pulp UI — version 1.0.2

User approved the visual overhaul on 2026-10-04. Balance is deferred. No changes to src/core or src/data.

## Implemented

- New original Thai horror cover, launcher icon/adaptive icon, initial loading screen, Start/Continue/Settings menu.
- Shared aged-paper panels, ink icons, parchment cards and paper buttons. Full-screen inventory, character selection, shops, upgrades, rewards and run summaries use matching ink colours.
- Compact map HUD: HP bar, energy, gold, deck and blessings controls, EXP bar. Battle HUDs for both sides have HP bars and labelled icon stats.
- Player cards sit side by side with horizontal scroll whenever the row exceeds screen width; tap opens a readable preview, dragging up still plays. Enemy cards remain face down until played. No enemy intent is rendered.
- Ink route map: connected markers, current lantern, completed stamps.
- Full-screen story/event illustration. On arrival, camera zooms and gently bobs for 2.5 seconds, then text and choices fade in over 450ms. Controls remain unavailable until arrival ends. Reduced-motion setting persists on device and skips the transition.
- Battle completion presents victory first, then existing engine-driven level-up choices and card rewards. Victory acknowledgment is per fight. Rewards are not recalculated by UI and animations never dispatch rewards.
- Version 1.0.2 / Android versionCode 3, same package and existing debug signing workflow for test APK updates.

## Visual provenance

Three original image-generation illustrations were created for this update: abandoned Thai stilt house cover (banana shadows, lantern, eerie figure in window), close-up female ghost icon, and under-house lantern/rest scene. Prompts specified coarse ink/halftone, worn ochre paper, muted olive/black/red, Thai one-baht horror comic appearance, no lettering. Icon resized to 1024px with safe foreground margins; PNG palette compression and JPEG export keep application assets smaller. No artwork from Night of the Full Moon was copied; only its readable illustrated card presentation informed the UI.

## Validation

TypeScript and all 541 tests pass, including seven presentation-order regression cases. Expo web export succeeds. Native ARM64/x86_64 build and signing/version/16KB audits passed. APK SHA256: 0302ff5e8fc5b7a6d93d7c63d0e0c1d22983aa3a49e3e14f73139b17375122b9.

Android API 36 UI smoke PASSED in [run 37187742043](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37187742043): launch, class selection, prologue, blessing, map, readable card preview with valid touch bounds, card use, enemy turn, victory BEFORE upgrades/card rewards, rest arrival and event choices/results. That run's smoke artifact includes 13 screenshots, accessibility dumps and result.txt. This covers the first fight and rest event on an emulator; physical-device and all-character visual testing remain pending.

[Download tested APK archive](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37186812643/artifacts/11297620479). Extract PhiKinHua-FirstNight-v1.0.2.apk and install over 1.0.1; package and signing certificate match.

## Android follow-up

The first emulator run found clipped/inverted accessibility bounds for the preview Use button because its parent covered only the hand row. PlayerHand now uses a full-screen box-none container and a separately positioned hand row. Encounter paper has an explicit width to prevent intrinsic text measurement from expanding it beyond the map viewport.

The UI patch workflow recompiles the release Hermes bundle against native APK run 37184012483, preserves every other APK entry, then aligns, signs and audits the result. It refuses changes to assets, dependencies or native configuration. Byte comparison confirmed only assets/index.android.bundle changed. Smoke-only run 37187742043 tested that exact patched APK; it did not build a different APK. The first revised smoke script accidentally skipped playing after discarding; the test was corrected to resume playing and then passed. No gameplay values were adjusted.

The local execution environment went offline during final delivery, so the tested APK could not replace the earlier provisional local/Library upload. Use the tested GitHub artifact linked above; the provisional local upload predates the card touch-bounds fix.

## Deferred

Card balance, costs, character HP/energy, drop rates and rewards remain unchanged. Settings currently offers reduced arrival motion; there is no audio system to control yet.
