# Ghosts in the scene and deck on a mat — v1.0.8

Application commit: `e3ca6657d0ee3ca28eedc011c9d733475dab31ef`.
Workflow: https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37412767794

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

Local and CI TypeScript and all 543 tests across 33 files passed. Final asset preparation, diff checks and Android bundle export passed. Both Android build and Android API 36 native emulator jobs completed successfully.

Native smoke opened all four class details and confirmed warrior; selected a real starter blessing; opened/closed player details, deck and blessings; opened the grouped temple-sword card and asserted its exact name and ×4 count; returned to deck/map; selected Pop, switched to Tanee, deselected Tanee and verified confirmation disappeared, then confirmed Pop into combat. Full regression completed card play/preview, enemy turn, victory before rewards, lantern rest/event and next location.

Final native screenshots were visually inspected: Pop/Tanee stand head-to-toe in the village clearing without a paper sheet or selection rectangle; selected Pop is brighter and Tanee/scene dim; description and wooden confirmation remain above the HUD. Deck screenshot shows all five warrior starter symbols and live count/cost/effects in two columns on the mat. Card details show sword art, correct text/count and close action. Later location shows floating Krasue and full-body dancer in the preserved haunted-hut scene. Pong Kang full-body art was inspected as a production asset, not reached in this native smoke.

APK v1.0.8 / versionCode 9:
https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37412767794/artifacts/11390855339

Native evidence:
https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37412767794/artifacts/11390238003

APK SHA-256: `6e4607a56ca0fd7e5f5b4b4f3824848194200052cde377657db7371738831d32`.
Certificate SHA-256 unchanged: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
Package `com.phikinhua.episode`, minSDK 24, targetSDK 36, ARM64/x86_64. APK signature v2 and 16 KB checks passed. Physical device has not been tested with this revision.

Prepared sizes: backgrounds 900×1600 (mat 900×1599) RGB JPEG; five symbols 256×256 RGBA PNG; four full-body ghosts 384×576 indexed PNG retaining alpha.

Native smoke adds ghost selection/switch/deselect, deck grouped card opening, exact card name/count and returning to the deck. Full existing smoke still covers all four class details, blessing, map, HUD links, battle play/turn/victory/rewards, rest/event and next location. Dedicated screen artifact includes initial/selected ghosts, deck and full card detail. Physical device has not been tested with this revision.
