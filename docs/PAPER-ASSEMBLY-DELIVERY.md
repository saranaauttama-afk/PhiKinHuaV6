# Paper Assembly delivery — 11 October 2026

One existing village route only. No APK, merge, or expansion. Branch: [work/paper-diorama-prototype](https://github.com/saranaauttama-afk/PhiKinHuaV6/tree/work/paper-diorama-prototype).

## Review files

- `PhiKinHua-Paper-Assembly-Preview.html`: download and open in a browser; exact Expo component and embedded assets, no network needed. Choose the ghost and enter. Use Settings to compare ON/OFF. Settings persist for the file/browser origin where local storage is allowed.
- `PhiKinHua-Paper-Assembly-ON.mp4`: complete 1.8-second assembly, followed by fixed battle HUD/cards.
- `PhiKinHua-Paper-Assembly-OFF.mp4`: fully assembled scene appears immediately after entry.

| Option | Entry behavior | Ambient movement |
|---|---|---|
| ON (default) | Sky → forest/village → rising ghost → foliage → HUD/cards | At most 1 pixel, slow cycle |
| OFF | Fully assembled immediately | Same subtle ambient drift |
| Reduced motion (game/OS) | Fully assembled immediately, overrides ON | None |

## Validation

- TypeScript: passed.
- Unit tests: **899 passed / 49 files**, including four new timeline/settings regressions.
- Browser: **12 passed**, two portrait viewports (360×640 and 393×852), no page errors. Covers observed layer timing, constant scale, no skip/reset control during assembly, fixed HUD/hand, sharp images, ink masks, three consecutive entries, actual end-turn event without replay, OFF restart persistence, preservation of an unrelated audio value, game/OS reduced motion, and no progression storage writes.
- Actual browser assembly entry including event scheduling: [1865, 1881] ms; UI-thread timeline is 1800 ms.
- Browser ambient performance: mean **16.67 ms/frame**, p95 **16.7 ms** (about 60 fps), 3-second sample. This is not Android device certification.
- Portable HTML: actual component, loaded images/fonts, OFF persistence across reload and entry passed; **no network requests and no page errors**.
- Original ghost/scene artwork, approved HUD/card components and gameplay engine: no changes.

## Limits and remaining work

Android device frame timing and memory are not yet profiled. Original scene textures plus ink overlay textures total approximately 48 MiB decoded before actor/UI textures. Preview file size is about 29 MB; download before opening on mobile. In-app attachment viewers may require choosing an external browser to execute the HTML. No public hosting URL was created. The prototype retains its existing local combat command path; this task does not expand it into the full production battle flow.

An unrelated pre-existing edit to `assets/encounters/enWell2.png` is excluded from this commit and left intact.

## Changed files

- `.github/workflows/paper-diorama-preview.yml`
- `app/components/GhostArt.tsx`
- `app/components/Settings.tsx`
- `app/components/paper/PaperDiorama.tsx`
- `app/components/paper/usePaperMotion.ts`
- `app/paper-diorama.tsx`
- `app/theme.ts`
- `assets/scence/paper-diorama-v1/foliage-ink.png`
- `assets/scence/paper-diorama-v1/forest-ink.png`
- `assets/scence/paper-diorama-v1/sky-ink.png`
- `assets/scence/paper-diorama-v1/village-v2-ink.png`
- `docs/PAPER-ASSEMBLY-DELIVERY.md`
- `docs/PAPER-DIORAMA-PROTOTYPE.md`
- `preview/paper-entry.tsx`
- `scripts/bundle-paper-review.py`
- `scripts/export-paper-review.py`
- `scripts/paper-diorama-check.cjs`
- `scripts/paper-ink-masks.py`
- `scripts/paper-review-check.cjs`
- `src/visual/dioramaSettings.ts`
- `src/visual/paperDiorama.ts`
- `test/paper-diorama-assembly.test.ts`
