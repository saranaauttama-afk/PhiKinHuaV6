# Pulp UI — version 1.0.2

User approved the visual overhaul on 2026-10-04. Balance is deferred. No changes to src/core or src/data.

## Implemented

- New original Thai horror cover, launcher icon/adaptive icon, initial loading screen, Start/Continue/Settings menu.
- Shared aged-paper panels, ink icons, parchment cards and paper buttons. Full-screen inventory, character selection, shops, upgrades, rewards and run summaries use matching ink colours.
- Compact map HUD: HP bar, energy, gold, deck and blessings controls, EXP bar. Battle HUDs for both sides have HP bars and labelled icon stats.
- Player cards sit side by side with horizontal scroll beyond five cards; tap opens a readable preview, dragging up still plays. Enemy cards remain face down until played. No enemy intent is rendered.
- Ink route map: connected markers, current lantern, completed stamps.
- Full-screen story/event illustration. On arrival, camera zooms and gently bobs for 2.5 seconds, then text and choices fade in over 450ms. Controls remain unavailable until arrival ends. Reduced-motion setting persists on device and skips the transition.
- Battle completion presents victory first, then existing engine-driven level-up choices and card rewards. Victory acknowledgment is per fight. Rewards are not recalculated by UI and animations never dispatch rewards.
- Version 1.0.2 / Android versionCode 3, same package and existing debug signing workflow for test APK updates.

## Visual provenance

Three original image-generation illustrations were created for this update: abandoned Thai stilt house cover (banana shadows, lantern, eerie figure in window), close-up female ghost icon, and under-house lantern/rest scene. Prompts specified coarse ink/halftone, worn ochre paper, muted olive/black/red, Thai one-baht horror comic appearance, no lettering. Icon resized to 1024px with safe foreground margins; PNG palette compression and JPEG export keep application assets smaller. No artwork from Night of the Full Moon was copied; only its readable illustrated card presentation informed the UI.

## Validation

Local TypeScript check and all 541 tests pass, including seven presentation-order regression cases. Expo web export also succeeds. APK CI runs the same suite, builds ARM64/x86_64, audits signing/version/16KB alignment and exercises the actual UI on Android API 36. See that run's smoke artifact for screenshots and result. Physical-device testing is still pending.

## Deferred

Card balance, costs, character HP/energy, drop rates and rewards remain unchanged. Settings currently offers reduced arrival motion; there is no audio system to control yet.
