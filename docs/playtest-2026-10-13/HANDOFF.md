# Playtest backlog #16 — 13 October 2026

Base: `7455b3a9f6a04f7d9492d7a34480be69cc155b04`. Preserves the other AI's audit commit `f1f053f`: non-stacking bargains, ungated existing class cards, level-4 rage, versioned research and the removal of combos/minions/fusion.

## Implemented and verified in CI; human balance acceptance remains open

| Item | Result |
|---|---|
| B01 | Starter blessing details use `describeBlessing`, including passives without a `desc`. Selecting does not grant a blessing. |
| B02 | Eight combat class skills use existing distinct artwork, 44px targets and check/cross/cooldown states; opening still only reads the skill. |
| B03 | Shared small coloured ink pictograms for player/enemy resources; tapping opens actual resource details. No circular frame required. |
| B04 | Player hand count/end-turn limit, turn draw, opening draw, hard safety cap and piles are separated. Map shows hand/draw. Ghost shows actual count/cap, draw and retained count. |
| B05 | One bag with Deck/Blessings tabs, totals, compact grouped cards, and readable blessing rows with costs. Grouping includes star/effect definition, ignoring physical-copy identities. |
| B06 | Equipment slots above the deck, empty-slot guidance, persistent owned-copy loadout, management outside battle, pre-battle review and equipped markers. Upgrades preserve copy identity; removed/changed-away copies lose selection. No free combat loadout changes or duplicated equipment. |
| B07 | 230ms page fade with 55ms staggering on board appearance/return/new slots; respects reduced motion and blocks invisible hits. No game commands or rerolls from animation. |
| B08 | Fresh same-seed simulation comparison and diagnosis of the starter multi-hit card; human pacing/balance remains an open acceptance item. |

## Hand design reconciliation

The newer AI document supersedes the old issue's assumption about a base of 3. New runs start with hand/end-turn limit 2 and draw 2. They remain independent stats. Opening draw follows the developed hand limit, then applies explicit opening penalties. Ordinary levels no longer roll hand/draw growth. Night-1 and night-2 bosses offer +1 hand or +1 draw **instead of a card**, capped at 4, and the reward is consumed once. Rare Pandora growth remains available. Existing saves keep already-earned stats; a positive gain never lowers a stat above the new cap.

This resolves the newer document's proposed choice between boss rewards/rare blessings using both, without combining hand and turn draw. `pandora_open_palm` grows hand/opening by 1, with its existing HP cost. Level-5 night-3 draw reduction remains, with a floor of 2 for the rarer-growth economy; a saved lower draw value is never increased by the penalty.

The hard held-card safety cap remains 10, separate from the end-turn hand limit. Extra mid-turn draws may exceed the end-turn limit; the player discards down at end turn. The QA win card remains excluded from opening counts and the APK workflow builds normal play.

## Validation

Verified game source: `1f7cd983a9a7efacf79252ce568604e938ef47f5` (tree `510f3055445114dec4f8b977e23a9e8cf735480a`). [CI run 38380455411](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38380455411): **verify, android and native all completed successfully**. Fresh TypeScript, 39 files / 542 tests, web export, 44 browser interaction checks at 320/360/393/412 px, and the 36-run CI smoke simulation passed (zero stalls). Scoped changed-content scan: 94 files, zero findings. This is not a blanket scan guarantee for all binary formats.

Android API36 normal-play smoke passed **12 checks across all four classes**, without synthetic fixtures. Representative starter, bag, blessings, hand-detail, combat and skill screenshots were manually inspected after downloading the native artifact. Native installation smoke is not physical-device or full-run acceptance.

[APK 1.0.42 / code43](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38380455411/artifacts/11804361808) was downloaded and independently SHA-256 checked against the audit: `994d35fd51597bc1094d9b6220bfc551ac3dfd701ce22c9e57997732a740ada8`. Package version/source commit match the delivery; V2 signature verifies and zipalign succeeds. This release-build APK uses the repository's debug signing certificate (not Play Store production signing). [Audit](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38380455411/artifacts/11804775755), [browser evidence](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38380455411/artifacts/11802444784), [native evidence](https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/38380455411/artifacts/11804855503).

The final evidence commit changes docs only, with byte-identical application, engine, data, assets, configuration, workflows and test scripts relative to the source above. CI/APK references remain tied to that exact game source, not to an untested code revision. Raw reports/screenshots are artifacts; summaries are `DELIVERY.json`, `mobile-results.json`, `native-results.json` and `balance-summary.json`.

Native smoke starts real runs in all four classes; equipment ownership/removal/upgrade/save and boss-growth edge cases are covered by engine tests and synthetic browser fixtures. Native smoke does not prove a full human run, card strength/fun or performance on every physical phone.

## B08 — measured follow-up, not final balance acceptance

Fresh baseline and new-hand runs used 20 seeds per class/difficulty (400 each), tactical policy, no QA card; both completed with zero stalls. Win percentages at difficulty 1/2/3/4/5: baseline **90 / 90 / 71.25 / 65 / 42.5**, current **92.5 / 87.5 / 56.25 / 35 / 10**. Removing frequent hand/draw rewards makes difficulty 3–5 harder. The new result does **not** meet the earlier bot targets for 3–5. Human pacing and balance must remain open; no claim of a final balanced release is made.

The reported early multi-hit card is consistent with `threefold_strike` (เข่าครูมวย): it is Common and one copy starts in the warrior deck; base 3×3, and its 2/3-star damage follows the shared star multiplier. Attack bonuses apply to each hit. Two upgrades per level reward can promote it early. The screenshot/report does not identify the exact run/seed or prove a specific 4×3 value. No isolated nerf was applied while hand growth was changing. Future tuning should compare early upgrade cadence and per-hit amplification against later rewards, rather than merely increasing ghost HP.

`balance-summary.json` records per-class wins, stalls, night turn counts and SHA-256 of the raw local reports. These are bot simulations, not a physical-phone or fun/60-minute test.

Controlled engine replay confirms the starting knee at one star deals 9 total damage without a buff, or 12 with the starting war cry's Strength +1 (4×3). Two stars: 15/18; three stars: 18/21. The fixture removes blessing/equipment/monster defence modifiers and starts the enemy at 100 HP. This demonstrates a plausible explanation of the report, not identification of the user's exact run. Reproducer: `npx vite-node --config vitest.config.ts scripts/feedback-card-diagnostic.ts`.
