# Paper diorama: one route, visual approval only

Branch: `work/paper-diorama-prototype`. Base: v33 `3d76e9ed3cd557a57392abe12e32a197efac1268`.

The opt-in `/paper-diorama` screen shows one village route and its 1.6-second transition into a battle against the existing **ผีตายโหงเรือนร้าง** (`phi-nang-yai`, the existing content ID). Export with `EXPO_PUBLIC_PAPER_DIORAMA=1`; the normal game entry, backgrounds, campaign and saves are unchanged. No APK or merge is part of this prototype.

The scene contains separate transparent sky, forest, village and foliage PNGs. The fifth layer uses the unchanged approved ghost bitmap through `GhostArt`. Ink detail stays sharp in every layer; there are no depth-of-field filters. Printed cream cut edges and offset silhouette shadows establish the paper planes. Generation used the built-in imagegen tool for four new environment assets only, under `assets/scence/paper-diorama-v1/`.

Shared prompt: portrait 1024×1536 vintage Thai pulp-comic ink, crosshatching, burnt sienna/olive/midnight blue, visible cream paper cut edges, genuine alpha transparency, no people or ghosts, no UI/text, no blur. The individual prompts request only (1) a night-sky panel, (2) tropical forest canopy, (3) rural Thai wooden stilt houses and an earthen lane, and (4) foreground banana/palm leaves. Ghost artwork was not generated or edited.

The layers have independent depth-dependent transforms. Drift is at most seven logical pixels; the sky never zooms. Camera entry changes each layer independently, with the ghost settling into the existing battle geometry. `MonsterArea`, `PlayerHand` and `PlayerHUD` retain the approved geometry and visuals. HUD/cards are screen-space siblings, not camera descendants. An optional `hideArtwork` prop suppresses only the duplicate MonsterArea actor and its idle loop. An optional tint on GhostArt draws the paper rim and cast shadow without changing the source image or normal rendering.

Reduced motion combines the existing game setting with live OS/browser preferences. It stops drift and enters battle immediately. Background visibility/app state stops idle loops. Reanimated shared values run the camera on the native UI thread: there are no React state commits per animation frame. The four scene textures total approximately 24 MiB when decoded at full source resolution; duplicates reuse the same source textures. Android device frame timing is not certified in this web-only prototype and should be profiled after visual approval.

The isolated preview uses a fresh local reducer state; it never saves a run, journal or discovery. Card actions and hand overflow use existing engine commands. Normal game screens remain unchanged.

`scripts/paper-diorama-check.cjs` verifies two portrait viewports, distinct layer transforms, fixed HUD/card bounds, no blur, mandatory route selection, game/OS reduced motion, canceled transitions, background suspension and no progression writes. It records normal and reduced-motion route-to-battle MP4 clips, and reports browser frame timing during recording. `.github/workflows/paper-diorama-preview.yml` performs TypeScript, unit tests, web export and browser checks only.

## Local validation (11 October 2026)

TypeScript and all 895 unit tests passed. The actual Expo web export passed ten browser checks across 360×640 and 393×852 portrait viewports with no page errors. Arrival measured 1.6–1.7 seconds including event scheduling. With transform compositing enabled, the 4.2-second browser sample averaged 16.67 ms per frame (about 60 fps), with p95 16.7 ms without recording and 16.8 ms while recording. These are browser measurements on the test host, not Android device certification.

Web images explicitly fill their paper plane so source pixel dimensions cannot crop the scene to one corner. The foreground canopy is raised above the actor's face. The preview uses v33 difficulty 1 initialization (two base energy and two opening cards), and the route label uses the unchanged content name for the selected ghost.

The source is committed locally. A remote push was rejected by automatic approval review because this prototype request did not authorize GitHub publication. Local web export, browser testing and recordings completed without remote publication. No APK was built and no branch was merged.

The user subsequently explicitly authorized pushing this prototype branch to GitHub on 11 October 2026. Publication proceeds through the connected GitHub account; APK builds and merges remain out of scope.
