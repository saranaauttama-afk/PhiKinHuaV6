# Battle cards and summoned helpers — v1.0.10 / code 11

Branch: work/occupation-table. User approved the battle mockup and enemy sequential cards plus summoned-helper visuals on 2026-10-06. Base f2dc758.

## Changes

Compact player portrait/HP/energy/block above the wider illustrated hand. Actual card symbols match the deck; brief hand summaries open scrollable full descriptions on a dark wood detail panel. A raised selected card dims other cards. Draw/discard counters and the separate clay end-turn control sit below the hand. Enemy HP is above the ghost; no future action is exposed.

ResolveEnemyTurn still calculates once through the reducer. Every emitted combat event now carries an immutable player/enemy/minion presentation frame. Battle renders those frames while playing the queue, so HP/block never jump to the final turn before the relevant impact. Facedown enemy cards enter before revealing individually; reveal, readable hold, impact and fade use compatible timing. Input remains locked through the full queue and summoned player actions. Skip reaches the authoritative state and starts the next player turn once. Victory/defeat overlays wait for playback. Exit skips the queue before leaving.

All nine registered minion templates have separate transparent PNGs, with real instance-to-template matching. Player helpers appear left, enemy helpers right, above the player HUD; tap for real effects and remaining duration. Entrance/expiry fade and activity lunge use instance keys. Helpers have duration, not HP: no invented HP bars. MinionActing/MinionResolved events show each helper before/after its effects. Enemy helpers now run on the actual enemy turn (previous ResolveEnemyTurn omitted them), including owner block; lethal helper damage prevents later cards. This restores their existing ability definitions rather than changing their values.

Assets: assets/minions/{kuman_spirit,ghost_ally,demon_minion,poison_spirit,shadow_clone,tree_guardian,ancient_warrior_spirit,spirit_snail,forest_demon}.png. Generated transparent 3×3 atlas, separated into 256×256 canvases. Prompt: nine isolated full-body Thai rural ghost helpers, topknot child, village ghost, clawed demon, poison spirit, shadow clone, rooted tree, ancient warrior, ghost snail and forest demon; bold uneven ink, faded ochre/olive/crimson, cheap one-baht horror comic. No text or UI.

## Validation

TypeScript and 546 tests across 33 files passed locally. Added regressions for independent pre-impact HP frames across two cards, real Kuman healing before/after frames, and lethal enemy-helper interruption. Web bundle exported. Android bundle/build/native smoke results will be recorded after CI finishes; not yet verified on a physical phone.

Android smoke now records 07-enemy-card.png during reveal and waits for actual turn completion instead of assuming a fixed seven seconds. Existing occupation/map/deck/card-play/victory/rest checks remain. First-chapter warrior smoke does not force helper summons; visual coverage of summoned helpers must be recorded separately.
