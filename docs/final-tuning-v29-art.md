# v29 encounter art manifest

Nine transparent vintage Thai horror comic object illustrations were generated and inspected, then losslessly kept as original PNGs in the generation workspace and converted to production WebP (maximum long edge 768px, quality 86). Alpha preserved. Existing matching objects were reused. No gameplay screenshots were taken.

The original per-call prompt text is not available in this handoff; the following is the design specification, not a verbatim prompt transcript: transparent isolated full object, rural Thai setting, vintage hand-inked horror comic linework, muted weathered colors, compatible with existing game art, no text or lettering.

| Final path under assets/encounters/thai-v29 | Object specification / use |
|---|---|
| shop-card.webp | Rural Thai trader's card stall with hanging talisman cards; card shop |
| shop-equipment.webp | Rural Thai weapons/equipment stall; equipment shop |
| upgrade-altar.webp | Card consecration ritual altar; upgrade |
| fusion-altar.webp | Ritual altar combining cards; fusion |
| treasure-single.webp | A single treasure offering/card object; single treasure |
| story-root.webp | Tangled haunted tree roots; night 3 story |
| story-water.webp | Cave water pool; night 4 story |
| story-manuscript.webp | Old palm-leaf manuscript; night 5 story |
| next-path.webp | Rural forked trail marker/path object; next event |

Reused exact matching art: `assets/encounters/enWell.png` for well; `assets/encounters/enTreasureOpenMini.png` for chest; `assets/ui/blessing-shrine-object.png` for healing shrine; `assets/ui/remove-torn-card-b17.webp` for removal; `assets/ui/trail-rest.png` for lantern story; `assets/cards/thai-v24/bell_sound.webp` for temple bell story. Runtime wiring: `app/components/EncounterArt.ts`. The art catalog references these same production files.
