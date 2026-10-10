# PhiKinHua v1.0.31 / Android code 32 — Three nights per run

Branch: `work/three-night-runs-v31`, based on framed encounters v30 (`a8cfc9b6`). User approved the proposed system and explicitly authorized implementation after the earlier pause. The approved v30 matching frames, circular portraits, local confirmation, quiet HUD and corrected service artwork are preserved. No new artwork or gameplay captures.

## Current rules

One run means three consecutive nights. The deck (including upgrades/fusions), blessings, equipment/backpack, gold, level, XP, unlock configuration, run metrics, RNG and discovery identity continue through dawn. Only temporary combat state is cleared; each dawn heals up to 12% of max HP, never a full refill. Completing nights 1 or 2 creates the next route and opens its story, without a run summary or tier unlock. A new run starts from the chosen class's starter deck/resources.

| Night | Route ghosts | Night boss | Services | Mandatory story |
| --- | ---: | ---: | ---: | ---: |
| 1 | 7 | 1 | 2 (card shop + heal) | 1 |
| 2 | 10 | 1 | 3 (shop + heal + special) | 1 |
| 3 | 10 | 1 | 3 (shop + heal + special) | 1 |

Normal completion: 30 battles. Difficulty 5 adds the mandatory real PhiKinHua after the third guardian: 31 battles, still night 3. Elites are included in route quotas; identities are distinct within each night's route, may recur between nights, and the whole archive is not forced into one run. Pools introduce the existing later-night pair and rotate rare ghosts without generating new art. First night guarantees a card shop. Shops may be card/equipment later; specials rotate treasure/one item/upgrade/remove/fusion. Services appear between fights, can be kept for later, and unused pages expire at dawn. Monsters deferred with Next Intersection and mandatory stories cannot be discarded or bypass the boss gate.

Difficulty is labelled **ระดับอาถรรพ์ 1–5**, separate from night. Each class unlocks the next difficulty only by winning all three nights at an unlocked level. Lower tiers remain replayable; defeats are logged without removing progression. Four classes × five completion tiers. Enemy mechanics retain curated 18/22/28-card decks, archetypes, live dodge/counter/poison/summon and sequential reveals. Increased difficulty uses elite quotas, strength, faster escalation, live boss phase swaps (levels 3+), elite/boss starting armor (4+) and boss phase energy (5), plus 5/10/15/20% HP. Chapter HP scales 1/1.28/1.58 to match the developing deck; it does not depend on postponed fight order.

| Difficulty | Elites night 1/2/3 | Boss phase |
| --- | --- | --- |
| 1 | 0 / 1 / 2 | none |
| 2 | 1 / 2 / 2 | none |
| 3 | 1 / 2 / 3 | two moves replaced, block +8 |
| 4 | 1 / 3 / 3 | phase + strength; initial block 6 |
| 5 | 2 / 3 / 3 | phase + energy; real ultimate mandatory |

Boss art/decks are reused: night 1 head collector; night 2 bell keeper at levels 1–2, root lord at 3–5; night 3 sorcerer at 1–3, cave mother at 4–5. Ultimate appears at level 5 only. Geography now progresses through five scene stages each night across the original 15 locations, rather than repeating the whole geographic journey each night.

## Story and compatibility

Each night concerns a different group of victims whose bodies are still alive without heads. Bring that group's heads back before its sunrise; the next night follows the next clue and victim group. New chapter IDs distinguish the three-night story from the earlier independent-night stories. Levels 1–4 restore the three groups but leave the original curse's source unresolved. Level 5 rescues the last group only after PhiKinHua and gives the true ending. Story objects share the route/destination mapping: lantern, roots, manuscript.

Adventure v4 snapshots validate difficulty, chapter, completed-night counters, quotas, exact deck partition, service counts, story and both boss gates. Full state and RNG persist at dawn, shops, rewards and settled battles. Existing v3 single-night saves/records remain supported as **legacy runs**, not silently converted to the new journey. Old journal histories, discoveries and card/blessing unlocks are retained. Legacy clears do not count as new three-night tier wins; new tiers start at 1. The journal keeps separate personal bests. Archive sightings count once per run while recording actual reveal chapters, including the ultimate first seen on night 3.

## Validation checkpoint

- Local TypeScript passed.
- All 781 tests across 46 files passed: includes 20 class/tier complete-run paths, exact 30/31 fights, save/RNG on every screen, carryover, modest healing, journal migration/idempotence, locked/failed/partial clears, class-specific entry and boss phases.
- Web export passed; real reducer fixture generation passed.
- Existing 108 mobile checks passed in CI 38054952320. New mobile checks cover difficulty locks, framed routes, all three stories, dawn and final totals at 360×640 and 393×852. The first run failed because a previously-read chapter changes its button from ข้ามบทนี้ to เดินทางต่อ; the test selector is corrected to accept both. Product code and APK source remain fdcef6e5. Corrected mobile rerun passed in CI 38055316693 / job 114222462460: all 148 checks (44 + 26 + 12 + 26 + 40). UI-only commit 8864ed0 is application-identical to APK source fdcef6e5.
- Native API 36 audit plays all five difficulty levels sequentially: 151 fights, three mandatory stories per run, chapter dawn checkpoints, cold combat restore, cancelled drag and durable archive. XML/logs only. CI pending.
- Signed offline universal arm64/x86_64 APK, package/code, signing and 16 KB audit: pending CI.
- Full-run pilot: `docs/three-night-v31-pilot.json`; normal cards, public-board vs random-affordable policies, six matched seeds per class/tier/policy (240 runs). This checks model stalls and relative class behavior, not human fun or actual session duration.

Human pacing/balance remains open, especially shaman speed and medium/warrior survival at high difficulty. The desired roughly 60-minute run needs timed player sessions. No claim that automated tests establish fun. Keep the QA พระประธาน card in this test APK as previously authorized. Audio and Google Play Closed Beta remain the next phase; remove QA features from the eventual beta build.
