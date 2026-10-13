# Phase 7 — NOTFM gap completion

> **Post-audit update (13 Oct 2026, 1.0.39 / versionCode 40).** Read `DESIGN-DECISIONS.md` first: it
> records why each rule and number is the way it is. Changes after the audit: bargain blessings no
> longer stack on the same rule (fixed nun prayers costing 3 AP), the 16 existing class cards are
> no longer milestone-locked, level 4+ starts rage one ghost turn sooner, research docs moved back
> to `docs/research/notfm/`, raw simulation JSON removed. Current numbers: `BALANCE.md`.
> The table below describes the original Phase 7 delivery; items 7–8 are superseded where noted there.

Base: `work/notfm-phase6` / `bce58b93333e02e9ca214c0468e59bd5d89fada1`.
Working branch: `work/notfm-phase7-research`. PR target: `work/notfm-phase6`.
No merge to main and no force push. Android test release: 1.0.38 / versionCode 39.

## Scope and verification

The remote Phase 7 branch initially pointed to the exact Phase 6 commit, and the existing local checkout had no uncommitted Phase 7 work. The user authorized developing the missing work from that baseline. The supplied gap analysis is retained beside this document.

| User requirement / gap | Implementation | Evidence |
|---|---|---|
| 1. All eight card types (G01) | Shared registry used by deck sections, archive filters and rules descriptions. Legacy skill/trap filters removed; catalog count derived from data. | `phase7.test.ts`, mobile starter-deck and eight-type filter checks |
| 2. Equipped cards and prayer queue (G02) | Compact scrollable HUD badges show equipped slots and countdown. Tap opens card details; prayers preview the multiplied result. Uses real state, including resumed saves. | Countdown 3/2/1/resolved regression; mobile details/countdown checks |
| 3. Pre-battle equipment selection (G04) | Picker before entering a fight allows zero to slot-count owned deck positions. Whole selection validated before battle entry. Selected instances move out of draw into equipment before opening draw; no duplicated definitions or instance ids. Equipment replaced during battle returns once; next fight rebuilds from masterDeck. | Ownership/duplicate/slot/save regression; mobile pre-equip check |
| 4. Random existing events (G05) | One existing independent event per night, selected with seeded RNG. Twelve event records have explicit night eligibility; class affinity doubles weight; no repeated event in one run. Story slot id and boss gate remain compatible with Phase 6. Every event has an unconditional safe exit. Two explicit optional bargains add persistent passives; choice is recorded in run memory and cannot pay twice. | Deterministic/eligibility/12-event coverage, safe exit, duplicate reward and lasting consequence tests |
| 5. Ongoing Pandora costs (G06) | Four additional bargains: discard for Mana/Block with retain −3; slot +1/turn-start Block with opening hand −1; prayer multiplier +1 with AP cost +1; additional borrow with HP payment on every borrowed card. The last cost bypasses armor and can be fatal. Existing seven gain-time Pandora blessings preserved. | Rule/affordability/per-copy cost/once-per-turn tests |
| 6. Permanent blessing progression (G03) | Journal stores `totalCompletedNights`; a terminal run adds credit once before trimming history to 60. Failed runs cannot reduce unlock tier. Journal v2 migrates the sum of available history once; already-trimmed old history cannot be reconstructed. | 65 failed-run eviction, idempotence and old-profile migration tests |
| 7. Class/difficulty tuning (G08) | Warrior starter temple blade damage 6→5; medium starting HP 58→60/Mana 4→6, oil damage 3→4 and borrow defense 5→7. AP/Mana/Draw growth and owned pre-equip improve the level-5 draw penalty's build counterplay. All five Phase 6 difficulty rules and 30/31 fights preserved. | Fresh baseline and Phase 7 simulations; bot conclusions only |
| 8. Resource growth and milestones (G07/G10) | Level rewards include AP +1, starting Mana +2 and Draw +1, with caps 3/10/4. Existing caps on slots/retain enforced by handlers too. Four non-starter class cards become milestone 1–4 options (16 total); rarity stays intact. Cards appear in normal shops/level/elite rewards only after the class clears the corresponding difficulty. Journal lists conditions; no automatic starting stat power. Existing art reused for each same card identity. | Resource/cap/pool-gating tests and tier/milestone simulation matrix |
| 9. Active play time (G09) | Monotonic timer separates combat/travel/reward. Root AppState and web visibility suspend counting, battle pause/menu suspends counting, resume resets the clock. Anchors are never serialized. Metrics persisted and shown in run summary/journal. | Deterministic pause/background/resume helper regression and live mobile pause check |

Prayer wait previews include ongoing multiplier modifiers. Equipment/prayer badges reuse existing card art. The UI review web export contains a test-only state trace; normal Android build does not enable it. No artwork regenerated, no explicit combo system added.

## Reproduce

```sh
npx tsc --noEmit
npm test -- --maxWorkers=2 --testTimeout=60000 --silent
CI=1 EXPO_PUBLIC_UI_REVIEW=1 npx expo export --platform web --output-dir /tmp/phikinhua-phase7-web
npx vite-node --config vitest.config.ts scripts/phase7-fixtures.ts
PHIKINHUA_CHROMIUM_PATH=/usr/bin/google-chrome node scripts/phase7-mobile-check.cjs
npm run balance -- --runs 20 --difficulty 1,2,3,4,5 --out phase7-audit/balance.json
npx vite-node --config vitest.config.ts scripts/phase7-matrix.ts
```

The mobile tests use synthetic checkpoints to exercise all card types and queued prayer states. They are responsive browser tests, not physical Android acceptance tests or human playtime measurements. The CI runner uses its installed Google Chrome; no browser binary download is required. `android-notfm.yml` verifies, exports, checks mobile UI, simulates and builds a signed normal-play release APK, then records source SHA, package version, certificate, alignment and APK SHA-256.

## Results at implementation checkpoint

- Local TypeScript: exit 0.
- Local tests: 38 files / 532 tests passed.
- Local web export: completed. Local mobile execution could not start because Chromium was absent. The installer received HTML saying `Site Unavailable / Unable to access this site.` instead of an archive. No alternate URL or proxy was attempted. Mobile execution belongs to the independently requested GitHub workflow and uses its already-installed Chrome.
- Fresh Phase 6 baseline: 400 seeded tactical bot runs, 20/class/difficulty. Zero stalls. (Raw JSON later removed from the repo.)
- Phase 7 full simulation: 400 seeded runs; zero stalls. Additional tier/milestone/alignment matrix: 96 runs; zero stalls. See `BALANCE.md` and raw JSON.
- Scoped publication scan: 66 changed/new files checked, zero findings; reviewed content is game code/data, supplied research and synthetic test evidence. See `publication-scan.json`.
- CI/mobile/APK results: recorded separately after completion; do not infer a pass from the implementation table.

## Remaining product validation

- Human mobile playtest to confirm feel of equipment/prayer/borrow builds and level-5 difficulty. The tactical bot represents one policy; random events and resource choices change the route/outcome distribution, so comparisons do not isolate any one balance change.
- Measure median human active run duration against the 60-minute goal using the new timer; simulation runtime is not player runtime.
- Physical Android installation/playtest is separate from signature/package/alignment validation and responsive browser coverage.
- Tutorial G11 and optional talent/nightmare systems were not among the user's nine requirements and are not added.

## Original Git authentication blocker (resolved)

Implementation commit: `d5a7ae556428717fc0839445bf2ad97d0defdcee` (local).

The authorized command `git push origin HEAD:refs/heads/work/notfm-phase7-research` failed with exit 128:

```
fatal: could not read Username for 'https://github.com': No such device or address
```

At that checkpoint no push succeeded and no PR/workflow was started. The user later explicitly authorized the existing GitHub connector/API for this missing-credential case. Publication then succeeded; the original local commits remain preserved on `archive/phase7-local-original-aeb407c`. No force push or merge was performed.

Final local verification before delivery: TypeScript exit 0; 38 test files / 532 tests passed; web export completed; 400 Phase 7 balance runs plus 96 additional unlock/alignment runs completed without stalls. The local hashes identify the tested code/data/scripts. The mobile tests were subsequently executed successfully in GitHub Actions using the runner’s installed Chrome; settled screenshots were downloaded and inspected.

## Confirmed delivery

- Verified source commit: `c039ab4af604f1692dfdf865a4e0a2b5a6fdc972`.
- [PR #15](https://github.com/saranaauttama-afk/PhiKinHuaV6/pull/15): `work/notfm-phase7-research` → `work/notfm-phase6`, open and unmerged.
- [CI run 38351594300](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38351594300): verify and android jobs both **success**.
- TypeScript, 38 test files / 532 tests, web export and 28 mobile browser checks passed. Four viewports: 320×568, 360×640, 393×852 and 412×915.
- Mobile timer recorded about 20.3 seconds of active combat in each synthetic fixture; the counter remained exactly equal throughout the pause check. The helper regression also checks background and resume gaps. See `mobile-results.json`.
- [Signed APK 1.0.38 / versionCode 39](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38351594300/artifacts/11791723073), ZIP containing `PhiKinHua-NOTFM-v1.0.38.apk`.
- [APK audit](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38351594300/artifacts/11791867457): signing verification, package/version, alignment, source SHA and APK SHA-256. Downloaded APK hash independently matched the workflow audit.

APK SHA-256: `de0aeaa2bba492df7a98127c5d8ad44e54d15c52439d8ec5023753ca5068841f`.

The final delivery-evidence commit changes documentation only. The verified game, data, package configuration and browser test script remain unchanged from `c039ab4`; `local-source-hashes.json` identifies those files. CI is reused only on that evidence. `DELIVERY.json` contains machine-readable source/run/artifact references without account metadata or download credentials.

No implementation/build item remains blocked. Physical-device installation/playtest and median human run time near 60 minutes remain product-validation work, not claims established by simulation or responsive browser checks.
