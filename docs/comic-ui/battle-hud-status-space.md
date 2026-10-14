# Battle HUD status space — 14 Oct 2026

The owner reported that the split skill/status/blessing strip overlapped when several statuses were active and requested moving skills and blessings into the HUD, allowing a shorter health bar.

The compact battle HUD now places the two class skill seals and the blessing amulet next to a shorter health bar in its first row. Resource stats and a compact end-turn bell occupy its second row; the portrait remains at the left. Skill/blessing circles retain the existing 30 px art system and 44 px touch targets. The compact end-turn button has a 56x44 px target. The non-combat HUD retains its previous layout.

Statuses have their own full-width 36 px row above the battle HUD. The shared status strip clips to its viewport and displays the horizontal scroll indicator when measured content exceeds the available width, rather than assuming seven statuses always fit. Status, skill and blessing detail actions are retained. Battle geometry reserves the updated 100 px HUD height and keeps the hand above the status row, with positions stable when statuses appear or disappear.

Validation: TypeScript and whitespace checks passed. The actual battle components were rendered with six hand cards, both skills, twelve blessings and twelve statuses at 320x568, 360x640 and 393x852. Measured health widths were 98/138/171 px, status viewports 304/344/377 px and scrolling content 480 px. Controls stayed inside the HUD without horizontal overlap; hand cards stayed above the status strip. The last status remained reachable after scrolling and opened its details, and skill/blessing panels remained clickable. Temporary review fixtures are removed from the delivered source. The pre-existing browser audio interruption remains outside this UI change.

Gameplay, balance and audio code are unchanged. Source goes to `work/audio-sfx` with `[skip ci]`; no new APK was requested for this layout follow-up. The existing v1.0.47 APK predates this change.
