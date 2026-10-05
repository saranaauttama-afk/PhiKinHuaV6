# Occupation table — 2026-10-05

Branch: `work/occupation-table`, based on `work/character-comic-page`.

Replaces the vertical records with the approved over-shoulder village scene: worried villagers behind a lantern-lit wooden table, four illustrated occupation sheets and live Thai names. Full composition stays visible with one normalized coordinate system for image and rotated touch targets. A dim blurred backdrop fills extra screen space without cropping the sheets. Safe-area spacing remains.

Tap a sheet to open one modal with large existing class illustration, real CHARACTER_CLASSES description, initial stats and passive. Back closes it without starting a run; confirmation passes the exact class ID to the existing onPick/newRun flow. Android back closes the modal. Short screens scroll the detail while confirmation/back remain visible. No core, class data or balance changes. Current classes stay shaman/warrior/nun/medium; mockup hunter/herbalist/monk portraits were adapted to actual warrior/nun/medium.

Asset: `assets/ui/occupation-table.jpg`, generated with built-in imagegen from approved reference 25394.png, encoded as RGB JPEG for Android resource compatibility. Existing class artwork is reused in the enlarged detail, matching the current game assets. Existing ritual-notice raster supports title/portrait; new scene pigments live in theme.ts.

Validation: TypeScript and web export pass. All 543 tests pass (2 workers, 30-second test timeout; the initial concurrent export/test run timed out two long simulations, then the colour-token check caught newly inlined colours which were moved to theme.ts). Actual exported React Native web application exercised at 412×915, 360×780 and 915×412: four distinct previews, modal close, warrior confirmation, no page errors, confirmation fully within viewport. Table/detail screenshots in `docs/evidence/occupation-table/` visually inspected. Web checks do not prove native Android behavior. No new APK built for this change; the previously delivered APK does not include this screen.

Prompt used with built-in imagegen:
Edit approved Thai one-baht cheap horror comic scene, preserve exact worried-villager night village, shoulder/hand foreground, lantern, table, coarse ink and ochre/red texture. Remove back arrow/title/subtitle for live UI. Preserve four parchment locations, blank lower labels. Left to right: male Thai shaman with ritual blade; temple warrior in muted red sleeveless shirt with sword; shaved-head female Buddhist nun in white; long-haired female spirit medium with doll. No UI labels or buttons.

## Native correction — v1.0.5 / code6

User's installed v1.0.4 showed missing live labels and unresponsive sheets. Original native run37259621503 built the APK but emulator smoke failed to locate warrior; latest UI hierarchy omits all four sheets. Previous web evidence is not native proof. Replaced function-valued absolute Pressable layout with non-collapsible numeric native wrapper and static fill Pressable; added actual class image children. Each sheet now uses the same ART_SOURCES class PNG as the detail modal, preserving identity rather than synthesizing another face. Tall 4:9 scene replaces letterboxing and blur; scene and hit targets use measured parent bounds. Header/footer alone respect safe areas.

New raster `assets/ui/occupation-table-tall.jpg`, built-in imagegen: extend original scene vertically to phone 4:9 with painted trees/sky and foreground shoulder/table; preserve villagers and paper positions. Second edit erases only paper portraits, reconstructing blank matching parchment. Actual character PNGs are rendered at runtime on those blank sheets. No character replacements were generated. Source and enlarged portraits are identical assets.

Android smoke now opens all four sheets by live accessibility label, checks the correct HP, captures each modal, closes each, then confirms warrior and continues full gameplay regression. Full build/audit and native smoke required before declaring corrected delivery. Package and signing stay the same. Version is bumped to1.0.5/code6 to distinguish this corrected APK. Core and balance unchanged.
