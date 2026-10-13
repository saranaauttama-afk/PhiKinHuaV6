# Playtest backlog #16 — 13 October 2026

Base: `7455b3a9f6a04f7d9492d7a34480be69cc155b04`. Preserves the other AI's audit commit `f1f053f`: non-stacking bargains, ungated existing class cards, level-4 rage, versioned research and the removal of combos/minions/fusion.

## Implemented, awaiting fresh CI / native acceptance

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

Fresh local TypeScript, 39 files / 542 tests and web export passed before publication. CI must re-run these plus responsive interactions/screenshots, simulations, signed APK audit and Android API36 UI smoke. Do not treat this provisional handoff as proof that those jobs passed.

Raw balance data belongs in CI artifacts, not source history. A comparison summary and final verified delivery references will be appended after the runs complete.

Native smoke starts real runs in all four classes; equipment ownership/removal/upgrade/save and boss-growth edge cases are covered by engine tests and synthetic browser fixtures. Native smoke does not prove a full human run, card strength/fun or performance on every physical phone.
