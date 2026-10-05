# Occupation table — verified 2026-10-05

Branch: `work/occupation-table`, based on `work/character-comic-page`.
Verified application commit: `dd8cb4a142c4ae41a38a0fe3a714ccd2afce8d1e`.

## Delivered behavior

The approved over-shoulder village scene fills the screen: worried villagers behind a lantern-lit table with four occupation sheets. Each sheet displays the same existing class PNG as its enlarged detail modal through ART_SOURCES. Names and touch targets are live UI. Shaman, warrior, nun and medium keep their existing identity, stats and passives.

Tap any sheet to open its large portrait, description, initial stats and passive. Back closes it; confirmation passes the exact class ID to the existing new-run flow. Detail content can scroll while confirmation and back remain visible. Android back closes the modal. No core or balance changes.

Active backdrop: `assets/ui/occupation-table-tall.jpg`. Built-in imagegen extended the approved scene to 4:9, then erased only the synthesized portraits from the sheets to restore blank parchment. Actual character PNGs are composited at runtime. Characters were not regenerated. The old `occupation-table.jpg` and web evidence are historical, not proof of current native behavior.

## Native correction

Installed v1.0.4 had letterboxing and invisible, unresponsive sheets. Its native smoke failed despite successful web checks. NativeWind's native interop lost function-valued Pressable styles. Static non-collapsible wrappers now own numeric layout, rotation and measured-parent coordinates; static Pressables fill them. Android ripple provides feedback. The departure button also uses static styling.

The tall backdrop uses measured parent bounds and fills the screen. Header and footer respect safe areas. Live names and actual portrait children stay attached to the touch wrappers.

## Final validation and APK

Final workflow: https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37264689924
Both Android build and emulator jobs completed successfully.

- All 543 tests and TypeScript passed.
- Android API 36 smoke opened all four class sheets, checked HP 50/66/44/46, closed each modal and confirmed warrior.
- Full regression passed launch, prologue, blessing, map, card preview with valid touch bounds, card play, enemy turn, victory before upgrades/card reward, rest and event.
- Final native screenshots were visually inspected: full scene, matching actual portraits, visible names, all four detail portraits/stats and visible burgundy departure buttons.
- Physical device has not been tested with this corrected APK.

APK v1.0.5 / Android versionCode 6:
https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37264689924/artifacts/11325854551

Package remains `com.phikinhua.episode`; ARM64 and x86_64 are included. Signing v2 verifies and the signing certificate remains unchanged.
APK SHA-256: `3f7501b3b64ef1ced99d30f0f5eb9232f7af876bdef81191407afae2c81d1acc`.
Certificate SHA-256: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.

Final native screen evidence (extracted from this exact run):
https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37266241599/artifacts/11326970512

The evidence workflow on `work/occupation-evidence` only reads the native smoke artifact and uploads the class screenshots plus its PASS result.
