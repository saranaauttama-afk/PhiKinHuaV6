# Comic UI playtest — v1.0.44

Base: `377a0884147793d4def2f7d8ae93e05859a4cd59`, including Claude's tuning merge.
Branch: `work/comic-ui-unified`.

## Changed presentation

- Class selection opens a dark manuscript cover and browses one existing class illustration per page. Completion indicators read the existing journal; class selection still enters difficulty choice.
- Adventure HUD has one row below HP: currency, deck, effective retained hand limit, draw per turn. Blessings, alignment and map skill remain accessible through the portrait details.
- Deck/blessings tabs have restrained manuscript/object styling.
- Card faces have tan hide grain and sparse stitches, with a gray hide face when unavailable. Existing character illustrations are reused.
- AP cost uses an oil lamp and a numeral, including 0. Mana costs keep their separate flask and numeral; mixed costs show both, using the actual supplied cost.
- The base card has no upgrade mark. Each additional existing star level adds one ink stroke, without changing upgrade calculations.
- Player card previews, deck details, history and both sides' status/rule details share the player's dark panel and Prompt type family.
- Battle skills are circular. A single amulet seal shows the total acquired blessing count, including duplicates, and opens the grouped blessing list.
- Both HP bars use a dark empty track, oxblood fill and ochre ink frame. End turn is a wooden bell plaque. Close/pause uses a circular brush X.
- History has no visible owner captions; player/ghost ring colors and accessible ownership labels remain.

## Validation and limits

TypeScript checked locally. Reviewed diff: no changes to `src/core`, `src/store` or `data` against the tuning base. No unit, balance, browser-test suite or emulator run requested; native layout and interaction acceptance are for the user's APK playtest. This document does not claim native or visual acceptance.

The dedicated `android-comic-ui.yml` workflow installs locked dependencies, checks TypeScript, builds the APK and audits package/version/signature/alignment. It does not invoke tests or an emulator. No QA win-card flag is enabled by this UI build.

## User playtest order

1. Open class book, browse all four pages, select class and difficulty.
2. Check adventure HUD values; open deck and portrait details/map skill.
3. Inspect cost 0 / AP / mana cards and upgraded cards in deck/shop.
4. In battle open a player card and enemy status/rage/history details; compare fonts and panels.
5. Open skills and all blessings, then close/back. Check HP and bell end turn.
6. Confirm hand retention, enemy turn and page return still behave like the tuning build.
