# Map, HUD and compact starter blessing — v1.0.7

Branch: `work/occupation-table`. Application commit: `aa2e5f2377da25fe6094254d78eb1e0b81bff60e`.
Workflow: https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37328381137

## Requested implementation

- Route uses chalk/ink ghost, lantern on a bench for rest, and haunted wooden house for the finale. Current node has a crimson circle and location label; passed nodes fade. The scrollable trail follows the actual journey plans and active row.
- Player HUD uses simple torn paper, the actual selected class sprite and name, prominent HP/bar, and gold/deck/blessing links. Energy and EXP are available by tapping the portrait in a player-details modal. Deck/blessing links keep the existing views; modal supports Android back. Map content and confirmation reserve the smaller HUD height plus safe area.
- Approved Backlog #4 compact starter blessing screen is implemented: smaller paper title, two compact illustrated sheets with actual names/descriptions and red Energy/HP emphasis, actual village background and live whole-card actions. Choices come from the existing state; unfamiliar blessings use the same readable paper layout. Core rules, stats, balances and selection flow are unchanged.

## Asset record

Built-in imagegen produced standalone transparent illustrations using the approved previews as reference, with no baked text. Production files are checked in; the full mockup is not used as a screen.

- `assets/ui/trail-ghost.png`: loose ivory chalk/ink ghost face, wild hair, simple expressive eyes; transparent exterior, rough Thai horror comic print.
- `assets/ui/trail-rest.png`: amber lantern on a small rural wooden bench, ivory chalk outline on transparent background.
- `assets/ui/trail-house.png`: haunted Thai wooden house with worn steps and bare tree, ivory chalk/ink, transparent exterior.
- Route assets are 256×256 RGBA PNGs.
- `assets/ui/blessing-herbs.png`: compact horizontal torn ochre paper; mortar, medicinal plants and herb book on the left, quiet empty paper on the right, no text.
- `assets/ui/blessing-ancestor.png`: same horizontal torn paper; shrine, lantern and ancestor shadow on the left, quiet empty paper on the right, no text.
- Blessing sheets are 800×333 indexed PNGs retaining transparency.
- Existing `paper-button.png` supplies the HUD/title paper; existing class sprites and village scene are reused unchanged.

## Validation

Local and CI TypeScript and all 543 tests across 33 files passed. Diff checks and local Android bundle export passed. Both Android build and Android API 36 emulator jobs completed successfully.

Native smoke opened all four class details, selected warrior, chose a real starter blessing, opened/closed player details, deck and blessings from the new HUD, previewed/played real cards, completed enemy turns and victory/rewards, entered the lantern rest event and reached the next location. Player-details energy and EXP were asserted. Final native images were visually inspected: compact readable starter layout, chalk/ink route, current rest marker after progression, selected warrior portrait, HP/gold updates and clear HUD links. This run randomly offered blessings other than herbs/ancestor; those correctly use the plain paper fallback with actual text. The generated illustrated sheets were inspected as prepared production assets.

APK v1.0.7 / versionCode 8:
https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37328381137/artifacts/11353947800

Native screenshot evidence:
https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37328381137/artifacts/11353744731

APK SHA-256: `7544d5ca62831f4311f51ea54d5c78d5429c39f43c8fcc9217a33d19e01a8f97`.
Certificate SHA-256 unchanged: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
Package `com.phikinhua.episode`, minSDK 24, targetSDK 36, ARM64 and x86_64. APK signature v2 and 16 KB compatibility passed. Physical device has not been tested with this revision.

The workflow uploads `Map-HUD-native-screens` separately: starter choices, first map, player details, deck, blessings and rest map, plus smoke PASS result. Full native regression also covers all four class details, battle card preview/use, enemy turn, victory, reward, rest and event. Physical device validation remains for the user.
