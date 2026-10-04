# Pulp UI — delivered version 1.0.3

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

## Follow-up — v1.0.3 (2026-10-04)

Branch `work/pulp-arrival-v3`, based on `3ac58d8`. Addresses backlog issue #1.
- Raster brush-lettered Thai title (`assets/ui/title-pulp.png`) on cover/loading.
- Actual generated worn paper strip (`assets/ui/paper-button.png`) replaces SVG button frames; labels remain accessible live text.
- Arrival camera travels 1.04→1.28 scale with visible step bob over 2.6 seconds, then fades controls. React frame updates on a wrapper View replace the Android/Fabric Animated.Image path that stayed static until completion. Final transform is retained. Reduced motion still skips arrival.
- Events render as standalone full-screen content, not nested inside the map fade. The nested fade previously concealed much of the event camera travel.
- Map scene is selected by reachable destination row, not last visited node/fight count; ending uses the haunted house instead of initial village. Each arrival retains the same source before/after fade.
- UI changes only; balance untouched. Version 1.0.3 / code 4, same package/signing.
- TypeScript and 543 tests pass, including destination scene regression cases. Web export passes. Android build/emulator result must be checked in Actions; not yet claimed. Smoke records an arrival video and before/during/after screenshots.

Asset generation: built-in imagegen. Title prompt: exact “ผีกินหัว”, hand brush Thai one-baht ghost comic lettering, aged ivory with coarse red/black outline, real alpha. Button prompt: blank wide old comic paper strip, fibers, torn edges, folded corners, quiet ivory label area, real alpha. Cropped to alpha bounds, resized and palette-compressed for bundling.

### Android visual QA correction
The full native build at `733e4cf` (run 37192802625) passed audit/UI flow, but screenshots exposed intrinsic Image sizing issues in the cover/button and video exposed static camera frames. Fixed explicit logo/button heights and moved camera/fade to React requestAnimationFrame updates. Smoke now requires different scene pixels between two pre-choice frames. A JS-only repack reuses the audited native APK only after an unchanged-assets/native-config guard; final result is pending.

### Camera verification and final small-button adjustment
Run 37194228647 (`a2b7f61`) passed audit and full Android UI smoke through victory/rewards/rest/event. Pre-choice scene pixel difference was 67.48 (threshold 3), confirming camera travel; source remained the lantern scene after fade. Cover/title/buttons visually passed. Card-preview buttons still showed an Android percentage-width sizing issue: the raster was narrower than its Pressable. Updated shared GameButton to measure the actual Pressable width and draw its background using numeric width. Latest smoke is scoped to cover/map/battle/card-preview/use because camera and flow code are unchanged; its result is pending.

## Verified delivery — 2026-10-04

Final UI implementation: `e40db28f7517c814faf353f688ba00abf705b15c`, branch `work/pulp-arrival-v3`.
[Final APK and scoped Android layout smoke](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37195190241): **success**. TypeScript and all 543 tests passed. Downloaded actual APK and matched CI SHA256/CRC/embedded bundle. APK artifact `11301255315`, version 1.0.3/code 4, 82,084,371 bytes; SHA256 `a9be82508d264f071a56b9508c90831897bb8928af4b38bcb9b8e5d58da1f53b`.

Android API 36 layout smoke launched, selected class/blessing, reached combat, previewed and used a real card. Visually reviewed final cover, card preview, small buttons and after-use screenshots: raster paper covers labels and buttons are readable. This final follow-up changed only shared button measurement, its test script/workflow, and documentation.

The unchanged scene/flow implementation was fully smoke-tested at `a2b7f61` in [37194228647](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37194228647): victory before upgrades/reward, rest/event decisions, and next-location continuation. Pre-choice scene pixel difference **67.48** (gate >3); inspected before/during/after frames showing camera movement, and retained lantern scene after fade. Evidence artifact `11300920320` includes arrival video and frames. Final layout evidence artifact: `11300832154`.

No physical-device playtest or human pacing/fun measurement is claimed. Balance, core and data are unchanged. Earlier pending statements above describe the iterations, not the final delivery.
