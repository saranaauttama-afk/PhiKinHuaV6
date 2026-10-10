# Final tuning — v1.0.29 / Android code 30

Branch: `work/final-tuning-v29`. Backlog: https://github.com/saranaauttama-afk/PhiKinHuaV6/issues/7

## Implemented behavior

Each night samples ten different route ghosts rather than requiring the entire archive. Main roster sizes are 12/14/16/18/20, introducing two new ghosts per later night and guaranteeing those two in that night's selection. Elite counts are 0/1/2/2/2. A 20% rare substitution in eligible nights preserves introduced ghosts. The night boss follows the ten fights and mandatory story; night five continues to the ultimate boss. Optional services stay available at the boss gate. Next Intersection still explicitly skips optional pages and defers visible ghosts.

Four service pages per night: one card/equipment shop after fights 1–3, mandatory story after 4–5, well/shrine after 6–7, and one treasure/upgrade/remove/fusion opportunity after 8–9. Adventure rewards grant 18/32/60 XP and 18/28/60 gold for normal/elite/boss victories; normal fights no longer force card rewards. Card/equipment stock prices are discounted once to 65% with minimum prices, preserving revisits.

All 34 ghost identities have owner-specific curated decks: 18 cards / 8 distinct moves for normal ghosts, 22 / 10 for elites, 28 / 12 for bosses; two awakened substitutions expand boss move vocabulary. Hunger, poison, dodge, thorns, fear, drain, curse, rush, rage and guard distinguish their behavior. Dodge persists into the next opposing turn and consumes one charge on an attack. Thorns reflects attack damage without recursive status reflections. Boss phase swaps affect actual hand/draw/discard piles once and survive save/load. Enemy played cards retain the existing readable sequential reveals; no intent UI added.

Map removes all three upper text rows and the selection helper, expands ghost height and left-aligns player resource icons. Battle removes night/fight text and ghost origin button; archive folklore remains accessible. Enemy stats read energy, block, cards. Player cards use lightning/cost badges and readable upgrade levels with no level-zero label. Pause remains functional.

Encounter illustration mapping is shared by map, destination and story screens. Shop, treasure, well, shrine, upgrade, removal and fusion are distinct matching objects. Five mandatory stories have relevant lantern, bell, roots, cave water and manuscript objects. See `final-tuning-v29-art.md`.

## Save behavior

Adventure schema is version 3. Version 2 complete-roster journey saves are rejected recoverably so the player can begin a new journey. Durable archive/profile discoveries are preserved. This test APK retains the authorized พระประธาน QA card. Audio and Google Play Closed Beta remain the next phase, not part of this delivery.

## Validation and remaining work

Local TypeScript passed. Full suite: 753 tests / 45 files passed. After final dodge/rare-pool adjustments, 57 targeted adventure/mechanics tests passed. The seeded simulation report `final-tuning-v29-pilot.json` contains 320 runs across four classes, five nights and two policies; zero stalled runs. Public-board wins out of eight per night:

| Class | N1 | N2 | N3 | N4 | N5 |
|---|---:|---:|---:|---:|---:|
| Warrior | 8 | 8 | 8 | 7 | 3 |
| Shaman | 8 | 8 | 8 | 8 | 8 |
| Nun | 8 | 8 | 6 | 3 | 5 |
| Medium | 7 | 7 | 5 | 4 | 2 |

These are independent seeded automated policies, not human playtesting or a claim that every class is equally balanced. Shaman pacing is still faster; target fight duration and one-hour nights need hands-on review. No simulation uses the QA win card.

The production web export passed locally. Local Chromium download failed with a truncated archive; browser DOM verification will run in GitHub CI. No game screenshots were taken. New CI adds 26 encounter/HUD/card checks at two mobile sizes; Android API 36 native verification checks the new 56-fight five-night route, resume, archive durability, header removal and absence of the battle origin label. These remote checks and the signed APK are pending at this commit. Older v28 native evidence has been corrected in its own handoff and does not validate v29.
