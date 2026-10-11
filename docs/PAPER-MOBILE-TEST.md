# Paper theater refinement — one village prototype

## Resulting presentation

- Sky is an opaque, stationary full-viewport base on every assembly frame and during ambient parallax. Original sky art is uniformly covered/cropped with 24 px bleed; no new artwork or distortion.
- Overlapping 3000 ms assembly: forest 400–1500 ms, village 450–1500 ms, ghost 1200–2300 ms, foliage 1800–2600 ms, fixed battle HUD/cards 2500–3000 ms. Smoothstep starts and stops each layer with zero velocity. No zoom, spring, skip overlay or per-turn replay.
- Original environmental bitmaps, ghost cutout and black ink textures are unchanged. Paper thickness/cast shadows stay sharp; no depth-of-field blur.
- Route and battle share village ground landmarks, independent from HUD/card coordinates. Configurable normalized anchors, authored compact/reference framing, character scale/offset, grounded/floating modes and contact shadow are in `src/visual/paperPlacement.ts`. Compact/reference ground landmarks (230 px at 640 px scene height, 410 px at 852 px) preserve the approved framing on both required portrait sizes. The current dangling-foot ghost intentionally floats 1.2% of scene height above the road anchor. Grounded mode aligns cutout feet exactly to that anchor; resizing preserves proportions and foot registration. This convention is applied only to this village.
- HUD/card components mount before entry to reduce assembly-time React work, remain fixed and unavailable until completion. Hidden route HUD must not intercept web pointers. Prototype image fading is disabled to avoid an additional native fade/reset; other GhostArt callers retain their original behavior.
- Settings label: **แอนิเมชันฉากกระดาษ**. Existing `phi-ui-settings` key remains compatible: ON default, OFF immediate, persistent game/OS reduced motion override ON, unrelated/audio settings preserved.

## Checks

Local checks: TypeScript; all unit tests; actual component browser checks at 360×640, 360×800, 393×852, 412×915, 432×960 and 480×800. Tests include real-time requestAnimationFrame traces, static sky on every observed frame, overlapping reveal windows/monotonic opacity/no reset, unchanged scale, fixed HUD/card positions, proportional full coverage, floating foot registration, repeated entry, normal combat without replay, settings restart and both reduced-motion sources. First/middle/final captures at 360×640 and 393×852 and normal-speed ON/OFF videos support visual review. Offline preview uses the exact component entry and tests without network requests. See delivery/workflow results for observed pass counts.

## Signed Android test build

`.github/workflows/paper-diorama-test-apk.yml` cancels superseded runs of this workflow on the same branch to avoid duplicate APKs, and requires TypeScript, unit and six-viewport web checks on a clean checkout before building one signed offline universal APK (ARM64/x86_64). Temporary build configuration uses `com.phikinhua.dioramatest`, versionCode 2, Expo test signing key and the exact `preview/paper-entry.tsx`; production application configuration is unchanged. It installs beside the game and can update the earlier test APK, preserving its settings.

Signature, portrait manifest, embedded bundle and 16 KB ELF/ZIP alignment are audited with exact source SHA. API 36 emulator checks six portrait sizes/densities, route/battle/card bounds, repeated entries, native assembly recording, OFF/ON persistence across cold restart, reduced motion and runtime errors. Native automation lets each normal animation complete before temporarily enabling OS reduced motion for fresh accessibility hierarchy reads; production code never writes OS preferences. Immediate OFF/reduced captures occur with normal OS motion before the 3-second transition could complete. Native input/paint may lag on CI emulators, so capture at 900 ms rather than assuming a 250 ms ADB dispatch deadline. A normal ON early capture must hide the fixed HUD, while OFF/reduced captures must match it.

## Limits

- This is an isolated one-scene test application, not a complete campaign APK.
- Uniform cover crops peripheral scenery on narrow screens; it does not stretch the artwork.
- Physical Android/GPU performance and unusual cutouts require manual testing. Emulator/browser timing does not establish performance on every handset. Original scenery textures occupy approximately 48 MiB decoded before actor/UI.
- No main merge, other scene conversion, art regeneration, or gameplay/card/balance change. Current v33 gameplay remains intact.
- Pre-existing unrelated local changes to `assets/encounters/enWell2.png` and `assets/images/bgBlessing.png` are excluded; clean CI uses committed originals.
