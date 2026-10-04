# Ritual map and battle UI — v1.0.4

Approved 2026-10-04. Scope: map/encounter selection and combat. Character notebook redesign remains backlog issue #2; not implemented here. Balance/core/data unchanged.

## Visual system
- Chalk route on battered timber-framed slate with red current-location circle.
- Ghost choices are torn notice sheets with ink portraits and red seal/fingerprints.
- Map player stats on frayed protective cloth with sacred thread.
- Monster health/stats on dark scratched wood, cream text.
- Player hand uses bound palm-leaf manuscript texture, ritual knife/cloth/pot artwork where the card name matches those motifs; other spells use manuscript artwork. Names/descriptions/costs remain live text; these are presentation motifs, not new card mechanics.
- Card preview uses protective cloth; combat HUD uses slate; end turn is a sacred-thread spirit pot with press tilt and label. Enemy turn disables it as before.
- Raised hand/preview anchor reserves space for the taller pot HUD.

Assets: `assets/ui/ritual-{slate,palm,wood,cloth,notice,jar,knife}.png`, generated with built-in imagegen, real alpha, cropped/resized/palette PNG. Prompts: single isolated UI object; bold coarse ink/halftone vintage Thai one-baht ghost comic; muted charcoal/ochre/ivory/vermilion; no writing; blank centers for slate/wood/cloth/notice/palm; frayed/torn edges and sparse dried red stains. Jar wrapped in sacred thread and knife with carved wooden handle. Full prompts saved in `docs/ritual-asset-prompts.json`.

Native raster surfaces use measured numeric dimensions to avoid previously observed Android intrinsic Image sizing errors. Live labels/accessibility remain intact. App 1.0.4/code5, same package and signing. Assets require a full native build, never JS-only repack against the old asset baseline.

Validation: local TypeScript check and all 543 tests passed (2 workers; initial parallel run had an unrelated long simulation timeout). Full Android build, audit, UI smoke and visual screenshot review pending.

Follow-up: enemy reveal cards also use palm-leaf textures. Minion/status anchors move up 35px with the hand to avoid overlaps. TypeScript and 543 tests pass again. UI-only patch workflow pins native asset baseline f0327b4 / run37201605166 and runs full native smoke; new assets/config still require full native build.

Native build/audit succeeded at run37201605166. Its full smoke reached victory, reward and rest/event but stopped at the camera check because Pillow was installed in the build job instead of the separate emulator job. Fixed future emulator dependency. Patch run37202816653 reached victory/reward, then returned to the Android launcher; investigating with guaranteed failure logcat capture. Do not claim that run passed. Visual review found text near cloth borders; added cloth/slate insets, reserved taller footer space, and moved encounter hint above the portrait. Full native smoke is required for delivery.

Crash diagnosis from run37203740829: Android Fabric `IllegalStateException addViewAt: failed to insert view [2008] into parent [1922]`, caused by child already having a parent. Native mount logs show palm background Image2008 moving from RitualSurface1920 to Animated card1922 during flattening/unmount at victory transition. Set RitualSurface `collapsable={false}` to preserve its native parent and keep the background Image mounted from the first render (initial numeric dimensions0), instead of conditionally inserting it after measurement. No core/state/balance changes. Full smoke required after this correction.
