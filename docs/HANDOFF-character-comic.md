# Character comic page prototype — 2026-10-04

Branch: work/character-comic-page. Based on verified ritual UI c621c52e8b806369c5a3d30e9a89e7a9320cfeb8.

Scope: only character selection. Clean ivory copy fields, near-black live text, four coarse ink comic records, village raster portrait backdrop, burgundy selection/check and departure button. Reuses actual class illustrations. Class statistics and passive descriptions come from CHARACTER_CLASSES; medium is 46 HP, 4 energy, 5 hand. No balance change.

New raster: assets/ui/character-comic-panel.png, built-in imagegen. Prompt: horizontal blank Thai one-baht horror comic record, imperfect black ink border, faded blue-grey Thai village on left third, blank light ivory copy field on right, wear only at edge, no writing or characters. Live text fields have opaque ivory underneath for predictable contrast. Title and button remain real text (Prompt); their shapes do not replicate the generated mockup's hand lettering. Selected character details remain accessible at the bottom of the scroll list. Fixed departure/back footer; smaller screens scroll all records.

Validation: TypeScript passed; all 543 tests passed. Web export passed. Playwright on actual exported application at 412x915 and 360x780: initial departure disabled, all four selections enabled departure, shaman departure reached next screen, no page errors, no horizontal overflow. Screenshots visually inspected. These are web previews of React Native implementation, not Android-device proof. No new APK built for this page yet. User reviews actual screenshot before further pages.
