# ผีกินหัว — คืนแรกที่บ้านร้าง

Expo 54 / React Native 0.81 / React 19 / TypeScript card roguelike. The current deliverable is a short, complete first chapter, targeting 5–10 minutes of human play before expanding the game. Duration and enjoyment are playtest goals, not measured device results.

## Latest UI follow-up

`work/pulp-arrival-v3`: **v1.0.4/code 5** adds ritual map/battle UI: chalk slate route, torn ghost notices, protective cloth, wood enemy badges, palm-leaf cards and sacred-thread pot end-turn control. Native-parent preservation fixes an Android Fabric crash at victory transition. [Download verified APK](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37205064645/artifacts/11304288187). Read `docs/HANDOFF-ritual-ui.md` for exact validation and `docs/HANDOFF-pulp-ui.md` for v1.0.3 title/button/arrival work. Balance unchanged. Character notebook design stays in backlog issue #2.

## Current source

Current work branch: `work/pulp-arrival-v3`, extending `work/first-chapter-apk` based on `forCodex` at `0cd4dc4aabde2410be9c3d46a8d1a2577f7e4238`. `main` is older. Read `docs/HANDOFF-first-night.md` first; `CLAUDE.md` and `context.md` contain historical information and are not a reliable snapshot of current implementation. No AGENTS.md existed in the audited branch.

## First chapter

Cover → character → short story → starter blessing → choose Pop/Tanee → lantern decision (heal, risky card, or pass) → choose Krasue/dancer → choose healing or card upgrade → Pong Kang finale → card reward and ending. Three real battles, with the existing reducer/command, equipment, class, card-reward and status systems. Rest nodes do not refill in this mode. Enemy cards stay face down until played; no enemy intent is displayed. The underlying reducer/command rules remain unchanged.

Tap a hand card to read it and press **ใช้การ์ด**, or drag upward. End turn with **จบเทิร์น**. Choose card rewards after winning. Old full-run engine mode remains available through `NewRun` without `runMode`; the current main menu starts the short chapter.

## Run and check

```sh
npm ci
npm test
npx tsc --noEmit
npx expo start
npx expo export --platform android
npx expo export --platform web
```

`app/index.tsx` and `app/battle.tsx` are live routes, using `src/store/gameStore.ts`. Core changes go through `applyCommand`; balance for the episode is in `src/core/balance/episode.ts`. Assets are statically wired through `app/components/Art.tsx` and catalogued in `src/art/catalog.ts`.

## Android deliverable

GitHub Actions **Android first chapter APK** builds a bundled offline, signed test APK with Expo's stable test/debug signing key. This is a test distribution, not a production signing setup. Application ID `com.phikinhua.episode`, version `1.0.4`, versionCode `5`, minSDK 24. ABI targets: ARM64 and x86_64. This is the same package and signing certificate as v1.0.3; it updates that installation.

Actions verifies package metadata, APK signature, 16 KB native ELF/ZIP alignment and offline JS bundle. A dependent Android API 36 x86_64 emulator job installs and launches the APK, navigates into a fight, previews/plays a real card and ends a turn. Screenshots, UI XML and logcat are uploaded as separate evidence. See the handoff for actual run results; successful build alone does not prove installation or launch.

## Visual direction

Thai one-baht horror comics: heavy uneven black ink, faded flat colors, coarse printing, simple local silhouettes. The first chapter introduced village/Krasue art and reused matching class/ghost sprites. Subsequent pulp UI added the cover/icon/lantern scene and raster title/buttons. v1.0.4 adds seven original ritual raster assets in `assets/ui/ritual-*.png`. Prompt/source records: `docs/first-night-art.md`, `docs/HANDOFF-pulp-ui.md`, `docs/ritual-asset-prompts.json`.
