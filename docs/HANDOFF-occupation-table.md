# Occupation selection — verified v1.0.6, 2026-10-05

Branch: `work/occupation-table`.
Verified application commit: `3d72b4dfbd242aa079da5022e10c3564955ca11a`.

## Current delivered behavior

The approved over-shoulder village scene fills the screen. Worried villagers stand behind a lantern-lit table with four occupation sheets. Sheets show the existing character portraits without visible occupation names, as requested. Accessibility names remain so the sheets can still be identified by assistive technology and native smoke.

Tap a sheet to open the approved torn-paper detail design: lantern-lit rural temple background behind the original class PNG, live title/description/stats/passive, crimson raster paper departure button and back action. All four classes share the background, with the exact original character art and class data. No characters were regenerated. No core or balance changes.

Each tabletop sheet and detail modal uses the same ART_SOURCES class PNG. Non-collapsible measured wrappers align the scene, portrait sheets and live touch targets. Static Pressable styles preserve native bounds. Android back closes the modal; confirmation passes the exact class ID to the existing new-run flow. Content can scroll while the confirm/back actions remain visible.

## Final validation and APK

Workflow: https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37272830307
Both Android build and emulator jobs completed successfully.

- All 543 tests, TypeScript and diff checks passed locally; CI repeated all 543 tests and TypeScript successfully.
- Android API 36 smoke opened all four class sheets, checked HP 50/66/44/46, closed each modal and confirmed warrior.
- Full regression passed launch, prologue, blessing, map, card preview with valid touch bounds, card play, enemy turn, victory before upgrades/card reward, rest and event.
- Final native screenshots were visually inspected: no tabletop names, full scene, correct original portraits, torn-paper page, temple background, readable class data and visible departure/back actions for all four classes.
- This revision was tested on an emulator; physical device has not been tested with v1.0.6.

APK v1.0.6 / Android versionCode 7:
https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37272830307/artifacts/11329089015

Package remains `com.phikinhua.episode`, minSDK 24, targetSDK 36; ARM64 and x86_64 are included. Signing v2 verifies, signing certificate is unchanged, and 16 KB checks passed.
APK SHA-256: `0ef380101b11da6ebaaa1fdf45010ab924b34d9925f96a93a6bf9f854aa8d038`.
Certificate SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.

Final native screen evidence:
https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37272830307/artifacts/11329374823

The main Android workflow now uploads the class screenshots and PASS result separately, alongside the full native smoke evidence, so they can be reviewed without downloading the gameplay recording.

## Asset and prompt records

Built-in imagegen was used with the approved two-screen preview as reference. Prepared game assets are checked into the repository; the full preview is not baked into the UI. Text and buttons remain live.

- `assets/ui/occupation-table-tall.jpg`: extended the approved village scene to 4:9, then erased only synthesized portraits from the paper sheets, restoring blank parchment. Existing class PNGs are overlaid at runtime.
- `assets/ui/occupation-temple.jpg`: background-only square rural Thai wooden temple courtyard at night, amber lanterns, slate-blue moonlit sky, tree silhouettes, coarse black ink, faded ochre and printed paper texture. No people or UI. Central path clear for a separate original sprite; soft parchment wear at top/bottom. Prepared as 768×768 RGB JPEG.
- `assets/ui/occupation-page.png`: a single blank 3:5 torn parchment page, irregular frayed edges, subtle brown wear, pale ivory/ochre paper grain and sparse faint crimson stains confined to the perimeter. Central 88 percent quiet pale paper. Transparent outside the edge; no text, drawings, temple, people, buttons, grids, stamps or fingerprints. Prepared as 600×1000 indexed PNG preserving transparency.
- Existing `paper-button.png` is tinted crimson at runtime with live light lettering.
- Existing `assets/classes/{shaman,warrior,nun,medium}.png` are reused unchanged.

## Earlier correction

Installed v1.0.4 had letterboxing and invisible, unresponsive sheets. Its native smoke failed although the earlier web check passed. NativeWind native interop lost function-valued Pressable styles. v1.0.5 moved bounds/rotation into static non-collapsible wrappers, filled the screen using measured bounds and rendered the actual character PNGs on the sheets.

v1.0.5 native workflow 37264689924 passed; user then installed it and approved the working screen. The next request removed tabletop names and approved the temple/torn-paper detail preview, implemented in v1.0.6 above. Old `occupation-table.jpg` and `docs/evidence/occupation-table/` web captures are historical, not proof of the current Android build.
