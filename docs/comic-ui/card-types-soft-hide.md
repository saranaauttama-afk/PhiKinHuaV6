# Approved card types: soft dyed rawhide — 14 Oct 2026

The user approved the eight softly tinted hides shown in `card-type-soft-colors-preview.png`. This replaces the earlier dark equipment-only surface. Every type keeps the same approved rawhide shape, wrinkles, stitching, and worn marks. Colors are defined in `app/components/cardTypeWash.ts`.

- Attack: faded rose; action: ochre cream; counter: pale sage; spell: pale lavender; mana: pale blue; prayer: ivory; equipment: light tan; curse: pale ash lavender.
- A small ink stamp at the bottom right identifies each type. Shapes differ for all eight types; related types share an ink color. Cost remains at the upper left, upgrade strokes at the upper right.
- The equipment rectangle, green equipment header, and printed type line on card faces are removed. Full type labels remain in tapped card details, the shop purchase confirmation, archive details, and existing list/filter controls. Screen-reader hints also include the type.
- The shared CardFace applies this in shops, deck views, reward/picker views, upgrades, and the archive. The player's hand and revealed ghost card fronts use the same palette and stamps. Ghost card types come from their existing definitions. Hidden ghost card backs keep the ordinary hide.
- Disabled hand cards still use the existing gray surface and gray art. Smaller hands reserve room for the corner stamp without covering the title or ability text.
- The preceding close-button fix is retained: only the selected removable adventure page shows its close seal; shops use the same paper close seal.

Validation: TypeScript and whitespace checks passed. Actual shared CardFace rendered all eight types. Browser checks covered selecting equipment in the shop without buying, full type text in the confirmation, no equipment/type text on the card face, a six-card hand and tapped prayer details at 360x640 and 393x852, and the enemy front stamp. Rendering used temporary fixture files, which are excluded from the final source. The browser emitted its existing audio play/pause interruption with audio disabled; no audio code was changed.

Core gameplay and balance data are unchanged. The delivery commit uses `[skip ci]` because the user requested screenshots and explicitly said not to create another APK. This revision has no new APK or version bump.
