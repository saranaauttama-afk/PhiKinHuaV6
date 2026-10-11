# Paper Diorama mobile test

Branch: `work/paper-diorama-prototype`. Scope: the existing approved village route and its local prototype battle only.

## Fix

- Measure the actual scene container rather than assume `useWindowDimensions()` equals the native stack's usable area. A scoped layout context gives the original HUD, hand and paper scene the same measured coordinates and safe-area insets. Other battle screens keep the existing layout fallback.
- Replace environmental bitmap deformation with uniform 1024:1536 source-aspect cover/crop. The village road stays registered to the actor foot line; its printed bottom remains beyond the screen. Each environmental layer has 24 logical pixels of overscan to cover ambient motion and cast shadows.
- Register the upper canopy and lower foliage separately inside the same original foliage animation. The canopy retains its upper position; lower foliage reaches the bottom instead of ending above it. Both use the original transparent bitmap and ink overlay, clipped in the empty middle, without new artwork.
- Keep the existing actor bitmap, dark ink masks, 1.8-second independent assembly, HUD/card components, reduced-motion handling and persisted ON/OFF setting. No gameplay or content changes.

## Local verification

- TypeScript: passed.
- Unit tests: 917 tests / 50 files passed. New regression cases cover six portrait sizes with zero, 24/24 and 32/48 safe-area insets, source aspect, road registration, bottom coverage and HUD/card separation.
- Actual Expo web application: 36 checks passed over 360×640, 360×800, 393×852, 412×915, 432×960 and 480×800 viewports. Screenshots cover route and battle; checks cover independent assembly order/timing, fixed scale, no skip controls, image aspect and overscan, fixed HUD/hand, three repeated entries, combat without replay, OFF persistence, preserved unrelated settings and game/OS reduced motion.
- Offline Web Preview is compiled from the exact `preview/paper-entry.tsx` component entry, including the production HUD and card components; no duplicate renderer.

## Signed Android test build

Workflow: `.github/workflows/paper-diorama-test-apk.yml`. Android build waits for TypeScript, all unit tests and the six-viewport web checks to pass on a clean checkout of this commit.

It builds **one universal, offline release-mode test APK** with ARM64 and x86_64 support, signed with Expo's test/debug signing key. The temporary build configuration uses `com.phikinhua.dioramatest` and opens `preview/paper-entry.tsx`; the repository's production application ID, entry and version remain unchanged. It installs beside the existing game. The native build audit checks signature, manifest/portrait orientation, embedded JS, 16 KB ELF and ZIP alignment, and records the exact source SHA.

The API 36 native emulator job installs that same APK, visits route and battle at 720×1280, 720×1600, 1080×2340, 1080×2400, 1440×3200 and 1080×1800 physical display sizes with corresponding densities, checks hand/control bounds and repeated entry, records assembly, checks ON/OFF persistence across process restart, reduced motion and native errors. Its results and captures are uploaded separately. See the linked workflow run for actual build/native results; the above describes checks, not an unobserved pass.

## Limits and review

- Uniform cover necessarily crops the outermost scenery on narrow phones; it never stretches source art. Original composition, assets and depth order are retained.
- Physical Android/GPU performance and devices with unusual cutouts still need manual testing. Browser frame timing and emulator results do not establish performance on every handset. Original art/ink textures remain approximately 48 MiB decoded before actor/UI.
- Test APK is an isolated prototype, not a production campaign build or Play Store release. The local battle command path remains unchanged from the approved prototype.
- Pre-existing unrelated local changes to `assets/encounters/enWell2.png` and `assets/images/bgBlessing.png` are excluded. The remote clean build uses their committed versions.
- No merge into main, additional scene conversion, artwork regeneration, or gameplay/balance changes.
