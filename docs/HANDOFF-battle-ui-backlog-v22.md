# PhiKinHuaV6 — Issue #5 / all ten backlogs

2026-10-09. Branch `work/battle-ui-backlog-v22`. Base `art/quiet-comic-ui` at `752c79c3ab7d00a9adf3d5048ce45a46fee2d1be`. Android 1.0.25 / code 26 / `com.phikinhua.episode`. No merge to main. Current README/source/handoffs were checked directly; no AGENTS.md existed.

| # | Implementation | Verification |
|---|---|---|
| 1 | Ink status symbols, muted green/red seals, one wood detail sheet for player/enemy/minion | Registry/runtime regression; mobile owner detail interactions |
| 2 | Shared transparent candle halo, no selected rectangle, dim other choices | Level-up, starter blessing, night, reward, deck/upgrade/fusion |
| 3 | Sequential reveals in separate lanes above each owner HUD | Geometry for 1–3 owners; live 1/2-owner animation DOM bounds |
| 4 | Compact name/HP, block/energy/card count, status rows | Actual reveal-frame counters, compact folklore detail button |
| 5 | Right-to-left circular blessing art over right of player HUD | Separate statuses, scrolling, tap details, End Turn separation |
| 6 | Parchment combo book, ordered cards, played/remaining, real payoff | Progress/success/order/restart/expiry feedback, bounded history; actual definitions |
| 7 | Equal rest/image/title tracks; multiline event options share measured height | Portrait bounds; selection confirmation/candle glow |
| 8 | Shared CardFace art/name/energy/level/ability, price separate | Select/confirm/cancel; poor/protected/last/capped guards, actual before/after |
| 9 | Actual offer type and correct action retained | All 10 rest types enter shop/event, return to the same legal rest row |
| 10 | 34 researched identities and distinct sprites including all bosses | Provenance/backstory/visual identifiers, asset presence and player-card/blessing hash uniqueness |

Combat retains one primary ghost plus summoned helpers. MonsterArea/reveal layout supports multiple owners without changing gameplay rules into an unrequested multi-enemy combat system.

## Art and folklore

See `THAI-FOLKLORE-ART-AUDIT.md` and `src/core/monsters/folklore.json` for Cultural Promotion, SAC, Fine Arts, Thai Junior Encyclopedia and Film Archive sources. ปอบใหญ่ is a possessed Thai villager; อสูรกาย becomes identifiable one-legged ผีกองกอย; ปีศาจไฟ becomes โขมดดง. Each night boss has a documented ghost species and explicitly fictional individual story. Ultimate ผีกินหัว is game-original. Sacred figures are not misclassified as hostile folk ghosts. Map and battle share canonical ghost art and offer tap-to-read provenance.

Shipped optimized assets: 34 ghost WebPs, 134 player-card WebPs, 16 blessing WebPs, 24 JPEG scenes. Nine existing distinct player-card illustrations remain. Named fusions have unique pictures; procedural fusions compose both parents. Enemy move cards intentionally share their owner's portrait, representing the same actor. All wired files exist. Asset-only montage inspection confirmed distinct subjects, rough black ink and faded rural Thai comic colors; no gameplay screenshot was captured.

New generated card prompts used the concrete Thai subject/action, rough black ink, faded ochre/olive/indigo/brick-red print texture, rural ritual/household objects, transparent background and no writing/frame/western fantasy. See `thai-art-prompts-v24.json`. Two rejected outputs were replaced with safe still-life prompts for a woven wrist armlet and a calm ancestral household offering. The selection asset is a transparent muted amber candle halo. Images are downscaled to 384 px WebP; halo is 256×384.

## Validation and build

Local `npx tsc --noEmit`, 684 tests in 42 files, production web export, Python/Node script syntax and `git diff --check` pass. Added tests cover reducer boundaries, legal rest returns, combo feedback/payoffs, portrait geometry, live enemy counters and upgraded trap text. Existing regressions stay enabled.

The Android workflow runs real component interactions at 360×640 and 393×852, repeats unit/type checks, prebuilds and builds with Gradle, audits signature/package/16 KB alignment, then installs in API 36 and checks native menu/class/night/blessing/map/card/victory/reward flow. Reports are JSON/logcat with no screenshot capture. Final run URL, source SHA, APK artifact and actual CI outcome are posted to Issue #5 after verification. Local export alone is not device verification.

APK is bundled offline, ARM64/x86_64, using the existing test signing setup. `EXPO_PUBLIC_TEST_WIN_CARD=1` deliberately retains the existing QA พระประธาน card for native smoke; exports without the flag omit it. Fixture route is web-only and requires `EXPO_PUBLIC_UI_REVIEW=1`; it is inactive in Android/normal builds.

Reproduce mobile checks after installing Playwright Chromium:

```sh
EXPO_PUBLIC_UI_REVIEW=1 EXPO_PUBLIC_TEST_WIN_CARD=1 npx expo export --platform web --output-dir /tmp/phikinhua-backlog-web
npx vite-node --config vitest.config.ts scripts/backlog-fixtures.ts
node scripts/backlog-mobile-check.cjs
```
