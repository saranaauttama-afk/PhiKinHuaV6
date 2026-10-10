# Archive notebook · v1.0.28 / Android code 29

Approved from the three-screen notebook design after v1.0.27. Branch: work/adventure-pages-b17.

## Delivered behavior

- Main menu opens บันทึกอาถรรพ์. Full-body ghost archive and the actual deck card face reuse existing assets, the illustrated menu background, dark ink fields and old paper tabs.
- Complete catalogue: 34 ghosts, ordered T1–T5 (17), Elite (6), legacy guardians (5), night bosses (5, ordered night 1–5), ultimate ผีกินหัว (1).
- 126 core player cards grouped by class: warrior 32, shaman 36, nun 27, medium 31. Separate four curse cards, twelve named fusion recipes and one QA พระประธาน. Unnamed fusions appear only when actually made/received; their two parent images are reused. Named fusion descriptions/costs/effects derive from the real fusion function.
- Default discovery view conceals unencountered names/cards. ดูทั้งหมด reveals the complete catalogue without unlocking anything. Seen/unseen, group, card type, rarity and sorting filters; Thai name/ability search; empty results and virtualized lists.
- Ghost detail: large existing art, baseline HP and authored ability, first/latest difficulty night and discovery/victory counts. Card detail: full art, energy, ability and read-only normal/upgrade-one preview, with parents for named recipes.
- Counts mean distinct journeys in which each identity was seen/defeated/obtained, once per identity per journey. Upgraded cards and duplicate copies do not create new collection identities. Ghost discovery includes visible map options and entered enemies; hidden future adventure entries are never credited. Shop/reward candidate cards are not credited until owned.
- Modal close and Android Back dismiss details/filters before leaving the archive. Two card columns and three ghost columns adapt to compact mobile screens.

## Durable progress

GameState.discovery contains a per-run ledger. UI-started runs receive a unique profile ID independent of combat RNG. Normal and suspended saves retain the ledger. An independent AsyncStorage profile, phikinhua_archive_v1, unions run snapshots monotonically: repeated commands, older checkpoints and cold resumes do not double-credit or erase discoveries. Starting a new run or clearing its autosave does not clear the archive.

Profile hydration buffers early observations, writes serialize, failed writes retain in-memory data and expose retry. Corrupt profile data is not silently overwritten. Save loading validates any discovery ledger. Existing v1.0.27 saves are supported; current owned cards, currently visible ghosts and recorded defeated IDs can be imported from the loaded state. Earlier encounters or discarded cards absent from that save cannot be reconstructed; no historical discoveries are invented.

## Validation status

Local: TypeScript passed; 710 tests / 44 files passed (including 11 new catalogue, checkpoint, acquisition, persistence, failed-write and corruption checks). JavaScript/Python verification harness syntax passed. No artwork generated/modified, no game captures.

Local Chromium download returned a truncated archive, so no local browser success is claimed. GitHub mobile workflow now runs the existing 70 checks plus archive inspection, locked/full views, filters, grouping, actual card/upgrade preview and no-credit assertions at 360×640 and 393×852. Native five-night workflow adds a 34/34 seen-and-defeated assertion, five-journey counts for ผีปอบ, card inspection and a cold archive reopen after all 146 battles.

Current source/APK commit e56d50c9d6697da07ab700d8471c01db838aa5cd, CI run 38017307432: https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38017307432 . Mobile job 114110334696 succeeded with 82 checks (44 regression, 26 adventure, 12 archive). All three downloaded JSON reports have errors=[] and screenshots=false. UI audit artifact 11656109517 ZIP SHA256 8e954e7f9148f4c09724c88fbe0cbbe8fc1849f872b33ab4936d9f8da5b9f409 matched GitHub.

Android job 114110334806 succeeded: 710 tests / 44 files, TypeScript, Gradle build in 17m52s, APK signing/16KB alignment/package checks. APK is 121,345,359 bytes, package com.phikinhua.episode, v1.0.28 / code29, ARM64 and x86_64, offline Hermes bundle. SHA256 3559efd62dc9046ce457902cef753be3869a3c2ccce4d5f77883f4786b30fbe8. Signature v2 certificate matches v1.0.27, permitting an update install. Downloaded ZIP digests and actual APK checksum/ZIP integrity verified. APK artifact 11656859047 and audit 11656823823. APK delivered to user.

Native job 114113941819 completed successfully in CI 38017307432. The five-night structure and archive cold-restart checks passed with the v1.0.28 APK; this was rechecked when starting v1.0.29. The old pending note was stale. v1.0.29 requires its own validation.
