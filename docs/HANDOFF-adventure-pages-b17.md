# Issue #6 · B01–B17 · v1.0.26 / code 27

Branch: `work/adventure-pages-b17`. Implementation began by reading the committed B17 plan at `586445d` and auditing the reducer, journey, store and save flow. The user explicitly permits discarding old saves and starting fresh; no old-save migration is required. New B17 saves preserve in-progress map, shop/event result, rewards, level-up and combat RNG.

## Delivered behavior

| Backlog | Implementation |
| --- | --- |
| B01 | Larger bounded ghost art; enemy reveal remains beside its owner. |
| B02 | One compact three-row player HUD, including small helper heads, statuses and blessing seals. |
| B03 | Lower overlapping hand, clear of the player HUD. |
| B04 | Compact enemy information rows. |
| B05 | Enemy statistics use icon + number with meaningful accessibility labels. |
| B06 | Illustrated statuses reuse existing card/blessing assets. |
| B07 | The ambiguous gold lore icon is replaced by the explicit `ที่มา` control. |
| B08 | Single themed status panel shows matching art, name, effect and remaining turns. |
| B09 | Tap lifts/inspects, upward drag plays, short/cancelled drag returns; separate cost and upgrade badges, readable gray cards. |
| B10 | Centered before/after upgrade modal; no charge before confirm, cancel preserves the underlying scroll position. |
| B11 | Equal fixed rest choices; actions follow the choice row. |
| B12 | Equal blessing cards with existing illustrations and explicit confirmation. |
| B13 | Mixed combat/shop pages render and dispatch by their own type; card shop uses the existing offering-tray art. |
| B14 | Upgrade uses the existing held-charm object; removal uses one new torn/burnt-card object. |
| B15 | Shared monotonic zone progression across map, combat and rest, preserving all existing environments. |
| B16 | Money/XP ordinary wins, optional rare rewards and preparation cards; shorter-run enemy HP/card budgets rebalanced and simulated with real cards. |
| B17 | Up to three independent pages; selected page alone replaces; unused shops can be postponed; confirmed Next Intersection discards only currently visible optional pages; finite 12-encounter pool; five mandatory stories/bosses and the final boss; exact new-save/RNG restoration. |

The 12 encounters comprise four normal ghosts, one elite, six optional preparation pages and one mandatory story. Night bosses appear only after all 12 pages are consumed, the story is resolved and all five ghosts are beaten. Nights 1–4 finish after six battles; night 5 requires seven. Skipping cannot bypass ghosts/story/bosses, and the same Next Intersection command never skips a newly drawn replacement. The journal and night-unlock checks now credit this 6/7-battle route.

An unused shop visit retains its slot and generated stock. A used shop resolves on departure. Treasure and story resolve once, including after restoration. A shared zone calculation prevents a postponed page from moving the environment backwards. After the fifth night boss, the rescued villagers restore the player to at least 75% HP before the mandatory final fight.

## Artwork

Exactly one missing asset was generated: `assets/ui/remove-torn-card-b17.webp` (256×256 transparent WebP). No existing illustration was regenerated or overwritten. Status art, blessings, ghosts, scenes, upgrade and shop objects reuse committed assets.

Prompt: a single aged ochre parchment playing-card object, ripped diagonally into two parts, charred lower corner with restrained red ember, abstract faded black ritual ink with no letters; vintage Thai horror comic ink, muted palette, strong silhouette, transparent background, no hands, scenery or frame. This differs structurally from the intact upgrade yantra instead of merely recoloring it.

## Validation and limits

- Local TypeScript check: passed.
- Local unit/integration suite: 695 tests / 43 files passed, including real reducer checks for all four classes × five nights, independent replacement, no refill farming, optional card rewards, mandatory stories/bosses, journal unlocks and exact save/RNG at every phase.
- Local production web export: passed. Python and browser-check script syntax: passed.
- Real-card balance pilot: 320 deterministic runs, four classes × five nights × two policies × eight seeds; no immediate-win card and no stalled runs. Raw results are in `docs/b17-balance-pilot.json`. This is automated policy evidence, not human playtesting or proof that all classes are equally balanced.
- Mobile browser checks: pending Actions. Local browser installation failed because the Chromium download was incomplete; browser checks are not claimed as passed locally.
- APK package/signature/16 KB audit and API 36 native five-night run: pending Actions.

The native run installs/clears app data, checks mixed-shop routing and preserved pages in all five nights, mandatory stories and 31 battles including all six bosses, next-night unlocks, cold combat resume and cancelled drag. It uses the existing test-only พระประธาน card to verify structure. Mobile browser fixtures independently verify card drag play, cancel, blessing confirmation, upgrade cancel/scroll, geometry and actual shop dispatch at 360×640 and 393×852. Both write XML/JSON/log evidence without game screenshots. The test APK retains พระประธาน; it is not a production-balanced release build.
