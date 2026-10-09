# Issue #6 corrections · v1.0.27 / code 28

Authorized after the user reviewed v1.0.26. This section supersedes the short-route delivery below.

- Every selected night starts a complete independent run: the same 28 ghosts, once each, plus its distinct final boss. Night five adds ผีกินหัว, for 29/30 battles. All 34 existing ghost identities remain represented across the five difficulty nights. Normal/elite/legacy guardian art and decks are reused.
- Finite deck: 28 fights, 12 optional services and one mandatory story. Resolving replaces only its own page. Leaving an unused shop retains its page and stock.
- Confirmed Next Intersection postpones visible ghosts in a saved FIFO queue, discards visible optional services, and preserves the story. Replacements cannot be skipped in that same action. Queued ghosts return once undiscovered pages run out. All 28 fights and the story gate the boss. Once only the last visible fights remain, Next Intersection cannot bypass them.
- Every difficulty traverses the entire village → temple → forest → mountain/cave route. Geography follows uniquely discovered encounters and never moves backwards when deferred ghosts return.
- Ghost HP/energy are based on identity and difficulty rather than chosen fight order. Later nights increase HP and strength. Removed the free 75% heal before the ultimate fight.
- Status detail uses one existing old-paper surface. Battle shows enlarged upper-body art, cropped below; enemy reveal is anchored beside its owner. Map uses full bodies with smaller props on a shared ground line. Transparent padding is normalized through metadata/layout only; no image is rewritten or generated.
- Treasure/single treasure reuse the actual deck card face, including energy, upgrade and ability; inspect, cancel or confirm รับการ์ด. Equipment inspection works even without money; confirm disabled when poor; currency/stock change only after ยืนยันซื้อ.
- Adventure save version 2 validates complete roster, exact visible/deferred partition and RNG. Old short-route saves are rejected with the existing recoverable restart message; user authorized new games.

Validation so far: TypeScript passed; 698 tests / 43 files passed; web export and JS/Python harness syntax passed. New mobile checks and fresh APK/native runs are pending CI. Local Chromium installation failed because its downloaded archive was truncated; this is not a successful mobile check. Real-card full-route pilot is still running. No game captures taken, no newly generated art. The test APK retains พระประธาน in each class’s first combat hand.

## Historical delivery: v1.0.26 (superseded route and affected UI)

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

Implementation commit: `cdf70d4`; status-popup/RNG correction: `b259e49`. Initial CI `37961367892` stopped at an ambiguous close-control selector; the corrected run `37961855214` passed the complete mobile checks.

- Local TypeScript check: passed.
- Local unit/integration suite: 695 tests / 43 files passed, including real reducer checks for all four classes × five nights, independent replacement, no refill farming, optional card rewards, mandatory stories/bosses, journal unlocks and exact save/RNG at every phase.
- Local production web export: passed. Python and browser-check script syntax: passed.
- Real-card balance pilot: 320 deterministic runs, four classes × five nights × two policies × eight seeds; no immediate-win card and no stalled runs. Raw results are in `docs/b17-balance-pilot.json`. This is automated policy evidence, not human playtesting or proof that all classes are equally balanced.
- Mobile browser checks: 60 checks passed (44 existing regression checks + 16 B17 checks), at 360×640 and 393×852, in Actions run `37961855214`. Both audit JSON files have zero browser errors and no screenshots. Local Chromium download was incomplete; browser success is CI evidence.
- APK build: passed in Actions run `37961855214` (Gradle 19m 6s). Package `com.phikinhua.episode`, v1.0.26 / code 27; offline Hermes bundle included; arm64-v8a and x86_64. APK v2 signature verifies, ZIP alignment passes, and all 42 native libraries meet 16 KB ELF/ZIP alignment checks.
- APK: 121,316,211 bytes; SHA-256 `14892dce7dd322845258749e0a2569b7be6902314988b2901044ad066d577ac0`. Downloaded APK checksum matches the CI audit.
- API 36 native five-night run: **passed**, [Actions run `37965979015`](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37965979015), tested commit `b018af9`. Downloaded XML/JSON/log evidence confirms all five mandatory stories, 31 battles, all six bosses, progression into each unlocked night, cold combat resume, cancelled drag, portrait layout and a living process without `FATAL EXCEPTION` / `JavascriptException` in the captured logcat. The report records 286 successful action/assertion steps; these are not 286 independent test cases. No game captures were taken.

The first native attempt installed/launched successfully but stopped at an anchored departure-button test selector: the real button includes the class name. Consequently build run `37961855214` has an overall failed conclusion, although its mobile and Android build/audit jobs passed. The corrected native harness matches the complete action. The successful rerun reuses the exact APK above, verifies its checksum, and checks that application code/dependencies/assets match built commit `b259e49`; no application change is hidden behind APK reuse.

Native evidence: [artifact `11634398881`](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37965979015/artifacts/11634398881), `B17-native-verification.zip`, SHA-256 `04e3c92d0a696d2dd5e27dc26e48722d1ce2b1b77903c744c176b7947b96af36`. Downloaded ZIP checksum matches the uploaded artifact digest. Its files are five completion XML dumps, latest XML, `results.json` and `logcat.txt`.

| Night | Battles | Mandatory story | Native boss names |
| --- | ---: | --- | --- |
| 1 | 6 | Passed | กระหังหนองร้าง |
| 2 | 6 | Passed | เปรตวัดร้าง |
| 3 | 6 | Passed | ผีป่าไทรพันราก |
| 4 | 6 | Passed | พรายแอ่งถ้ำ |
| 5 | 7 | Passed | ปอบครูอาคม → ผีกินหัว |

The native run installs/clears app data and follows the warrior class through all five nights. It checks mixed-shop routing and preserved pages, mandatory stories and 31 battles including all six bosses, next-night unlocks, cold combat resume and cancelled drag. It uses the existing test-only พระประธาน card to verify structure. Mobile browser fixtures independently verify card drag play, cancel, blessing confirmation, upgrade cancel/scroll, geometry and actual shop dispatch at 360×640 and 393×852. Both write XML/JSON/log evidence without game screenshots. The test APK retains พระประธาน; it is not a production-balanced release build.

Night-five pilot wins (eight seeds per policy) show a remaining class gap, especially for warrior. These figures use normal cards and the same preparation policy; they are distinct from the native structural test.

| Class | Random affordable | Public-board policy |
| --- | ---: | ---: |
| Warrior | 1/8 | 2/8 |
| Shaman | 6/8 | 8/8 |
| Nun | 3/8 | 6/8 |
| Medium | 3/8 | 7/8 |
