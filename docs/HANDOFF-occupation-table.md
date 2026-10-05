# Occupation table — 2026-10-05

Branch: `work/occupation-table`, based on `work/character-comic-page`.

Replaces the vertical records with the approved over-shoulder village scene: worried villagers behind a lantern-lit wooden table, four illustrated occupation sheets and live Thai names. Full composition stays visible with one normalized coordinate system for image and rotated touch targets. A dim blurred backdrop fills extra screen space without cropping the sheets. Safe-area spacing remains.

Tap a sheet to open one modal with large existing class illustration, real CHARACTER_CLASSES description, initial stats and passive. Back closes it without starting a run; confirmation passes the exact class ID to the existing onPick/newRun flow. Android back closes the modal. Short screens scroll the detail while confirmation/back remain visible. No core, class data or balance changes. Current classes stay shaman/warrior/nun/medium; mockup hunter/herbalist/monk portraits were adapted to actual warrior/nun/medium.

Asset: `assets/ui/occupation-table.jpg`, generated with built-in imagegen from approved reference 25394.png, encoded as RGB JPEG for Android resource compatibility. Existing class artwork is reused in the enlarged detail, matching the current game assets. Existing ritual-notice raster supports title/portrait; new scene pigments live in theme.ts.

Validation: TypeScript and web export pass. All 543 tests pass (2 workers, 30-second test timeout; the initial concurrent export/test run timed out two long simulations, then the colour-token check caught newly inlined colours which were moved to theme.ts). Actual exported React Native web application exercised at 412×915, 360×780 and 915×412: four distinct previews, modal close, warrior confirmation, no page errors, confirmation fully within viewport. Table/detail screenshots in `docs/evidence/occupation-table/` visually inspected. Web checks do not prove native Android behavior. No new APK built for this change; the previously delivered APK does not include this screen.

Prompt used with built-in imagegen:
Edit approved Thai one-baht cheap horror comic scene, preserve exact worried-villager night village, shoulder/hand foreground, lantern, table, coarse ink and ochre/red texture. Remove back arrow/title/subtitle for live UI. Preserve four parchment locations, blank lower labels. Left to right: male Thai shaman with ritual blade; temple warrior in muted red sleeveless shirt with sword; shaved-head female Buddhist nun in white; long-haired female spirit medium with doll. No UI labels or buttons.
