# ผีกินหัว — คืนแรกที่บ้านร้าง

Expo 54 / React Native 0.81 / React 19 / TypeScript card roguelike. The current deliverable is a short, complete first chapter, targeting 5–10 minutes of human play before expanding the game. Duration and enjoyment are playtest goals, not measured device results.

## Latest UI follow-up

`work/pulp-arrival-v3`: v1.0.3/code 4 fixes scene arrival visibility and destination persistence, adds raster comic title and old-paper buttons. Read `docs/HANDOFF-pulp-ui.md`. Android build/emulator verification status is recorded there. Balance unchanged.

## Current source

Work branch: `work/first-chapter-apk`, based on `forCodex` at `0cd4dc4aabde2410be9c3d46a8d1a2577f7e4238`. `main` is older. Read `docs/HANDOFF-first-night.md` first; `CLAUDE.md` and `context.md` contain historical information and are not a reliable snapshot of current implementation. No AGENTS.md existed in the audited branch.

## First chapter

Cover → character → short story → starter blessing → choose Pop/Tanee → lantern decision (heal, risky card, or pass) → choose Krasue/dancer → choose healing or card upgrade → Pong Kang finale → card reward and ending. Three real battles, with the existing reducer/command, equipment, class, card-reward and status systems. Rest nodes do not refill in this mode. Enemy card plans are visible and committed during the player's turn; debuffs refresh damage estimates without rerolling cards. Numerical hints exclude block absorption and other status/trap effects.

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

GitHub Actions **Android first chapter APK** builds a bundled offline, signed test APK with Expo's stable test/debug signing key. This is a test distribution, not a production signing setup. Application ID `com.phikinhua.episode`, version `1.0.1`, versionCode `2`, minSDK 24. ABI targets: ARM64 and x86_64. The separate ID avoids update-signature conflicts with `com.phikinhua.app` and starts with its own saves.

Actions verifies package metadata, APK signature, 16 KB native ELF/ZIP alignment and offline JS bundle. A dependent Android API 36 x86_64 emulator job installs and launches the APK, navigates into a fight, previews/plays a real card and ends a turn. Screenshots, UI XML and logcat are uploaded as separate evidence. See the handoff for actual run results; successful build alone does not prove installation or launch.

## Visual direction

Thai one-baht horror comics: heavy uneven black ink, faded flat colors, coarse printing, simple local silhouettes. Generated only the village scene and a transparent Krasue replacement for this chapter; reused the four matching class sprites and four matching ghosts already present. No full asset batch. Prompt and source records: `docs/first-night-art.md`.
