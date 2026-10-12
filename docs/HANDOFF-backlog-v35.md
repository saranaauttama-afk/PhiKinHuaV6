# v35 — battle feedback backlog and restored QA card

Branch: `work/enemy-hand-v34`, based on v34 `0ae9e6c`. No main merge or Paper Diorama import.

- T37: hidden held-card rack above the compact enemy HUD uses live/presentation hand counts. Enemy draw, consume and end-turn frames preserve the count without exposing unplayed IDs. Reveals launch from that row and finish above the HUD; full face dwell is 1.4 seconds.
- T38: removed the battle animation skip button. Pause still settles presentation safely before saving.
- T39: new physical player cards slide/rotate into the hand with staggered timing. Retained mounted copies do not replay their entrance. Reduced-motion cards appear immediately, and live cards remain opaque.
- T40: existing v5 service persistence remains unchanged. The return button and Android back preserve the shop; an explicit top-right X destroys its page. Stock/receipt persistence has engine and mobile regression coverage.
- T41: encounter confirmation uses the existing parchment button art, themed ink icon and dark ink text; removed the opaque rectangular red fill.
- Combined history: last six successfully played cards, oldest left/newest right, both sides in actual resolution order, with side, turn and actual results. Interrupted enemy attempts are recorded; failed player attempts are not. History survives combat saves and resets at the next fight. It never feeds AI, costs, rewards or RNG.
- พระประธาน: enabled with `EXPO_PUBLIC_TEST_WIN_CARD=1` only during the Android test bundle. The existing first-hand, zero-cost, instant-win behavior is preserved across all four classes. Production exports without the flag remain disabled.

Version: `1.0.35`, Android code `36`. APK artifact: `PhiKinHua-Backlog-v1.0.35.apk`.

Local verification: TypeScript and all 962 tests passed. All 160 full three-night simulated runs (four classes × five difficulties × eight seeds) produce a byte-identical report to `docs/v34-balance-results.json`. The QA card is disabled in those simulations. The web export succeeds. Local Chromium download was truncated, so mobile browser verification and native APK checks run in Actions.

CI verifies mobile geometry at 320×568, 360×640, 393×852 and 412×915, motion on/off, hand retention, draw entrance, history inspection, cold resume, shop purchase/return/reentry and explicit X. Native smoke verifies first-hand QA cards and QA victory in four classes plus enemy history and cold resume in the warrior fight, without screenshots. APK/native acceptance is pending until the workflow completes.

Human balance, roughly one-hour pacing, audio and Closed Beta remain future work.
