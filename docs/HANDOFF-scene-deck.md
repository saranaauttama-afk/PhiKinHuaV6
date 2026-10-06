# Ghosts in the scene and deck on a mat — v1.0.8

Branch: `work/occupation-table`, based on verified v1.0.7 source/doc tree dbc979971e90d2901fcf7481ea89ba607597f2c6. User approved both designs on 2026-10-06.

## Behavior

Combat choices use the transparent ghost illustrations preserving the original identity directly in the current location. First stage uses a new village clearing with a hut on the left and banana grove on the right. Tapping selects a ghost, reveals its original colors, dims the other ghost and scene, and shows the real description and a wooden departure action below. Switching/deselecting remains possible. No encounter paper or rectangular selection border around a combat ghost. Existing route/HUD and travel camera remain. Noncombat stop actions and later location backgrounds remain; their selection border is removed too.

Deck uses a dark woven reed mat on wood and two columns of small paper cards. Cards show their real name/cost, primary effect and duplicate count; attack effects use red ink, skills dark ink. Each card always has a raster symbol: exact clap/sword/guard/parry/breath moves for the warrior starter deck, then a consistent action vocabulary for other cards and existing knife/jar/ghost illustrations for traps/equipment/curses. This is symbolic illustration, not a unique portrait for every card. No missing-image placeholders.

Tap a grouped card to open its full live details. Existing CardRow mechanics remain visible including conditions, held effects, cost-rule/exhaust/upgraded/fusion/multiple-hit badges and full description. Paper remains on actual card surfaces; the screen and close/equipment controls use mat/wood. Android back closes card details. Equipped item removal, available equipment equip and capacity checks are preserved. No core rules or balances changed.

## Assets and prompts

Built-in imagegen produced seven independent production assets; no generated text or full UI screenshot is baked into the app. Prompt set:

- `deck-mat.jpg`: portrait top-down old dark brown reed mat on rural wooden tabletop; subtle warm lantern light, quiet central weave, ragged edges; vintage cheap Thai horror comic heavy imperfect ink/faded brown-olive grain; no cards/UI/text/paper.
- `map-crossroads.jpg`: portrait village night clearing, dilapidated hut left, banana trees right, ominous moon, weak lantern; central foreground clear for separately overlaid sprites, upper/bottom quiet for independent UI; heavy uneven black ink/faded ochre-olive print; no creatures/people/paper/text.
- `card-clap.png`: standalone clapping human hands with jagged impact marks, transparent outside; coarse near-black ink, faded sepia and muted red.
- `card-sword.png`: standalone old Thai temple sword, wrapped hilt/red cloth knot and broad diagonal blade, same ink/sepia palette, transparent outside.
- `card-stance.png`: chest-up muay Thai fighter in defensive guard with raised fists and red wrist wraps, same coarse ink/sepia, transparent outside.
- `card-parry.png`: forearms/open hand deflecting an incoming fist sideways with sweeping motion, same palette, transparent outside.
- `card-breath.png`: side profile taking a deep breath with three curved breath lines, same palette, transparent outside.

Four new map-only full-body sprites extend the original Pop/Tanee/dancer/Pong Kang portraits downward while preserving their faces, poses, costumes and coarse ink. They show full skirts/legs/bare feet or fur/clawed feet with transparent exteriors, no background or paper. Files: `map-pop.png`, `map-tanee.png`, `map-dancer.png`, `map-pongkang.png`. Existing battle portraits stay unchanged; Krasue already has its complete floating silhouette.

Existing route slate/icons, player HUD/class portraits and ritual paper/wood/knife/jar assets are reused unchanged.

## Validation

Local TypeScript and 543 tests passed while implementing. Final asset/bundle/native results are pending and will be updated after build.

Native smoke adds ghost selection/switch/deselect, deck grouped card opening, exact card name/count and returning to the deck. Full existing smoke still covers all four class details, blessing, map, HUD links, battle play/turn/victory/rewards, rest/event and next location. Dedicated screen artifact includes initial/selected ghosts, deck and full card detail. Physical device has not been tested with this revision.
