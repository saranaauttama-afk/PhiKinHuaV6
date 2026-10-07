# Battle layout and post-battle UI — v1.0.12 / code 13

Branch: `work/occupation-table`. Approved 2026-10-07 from physical-device screenshots.

## Seven requested fixes

1. Player hand reserves 24 px above its resting cards so the selected 12 px lift retains the card head and energy badge inside the horizontal viewport.
2. Hand width and stepping depend only on viewport width, using a fixed five-card spread. Four/five-card turns share identical spacing; larger hands scroll. The last card has no trailing overlap margin.
3. The floating text above helpers was combo progress, not helper labels. Combo/trap/player-status content now sits on its own slate beneath player health, with an explicit คอมโบ label; helper heads remain directly above their owner health and keep duration badges/tap details.
4. Enemy statuses use opaque dark badges, light Thai text, stacks and explicit remaining turns inside the wooden HUD. No enemy intent.
5. Victory preserves the battle scene under a dark scrim, with a wooden ปราบสำเร็จ banner, raster amulet, slate EXP/cowrie summary and illustrated continue button. EXP animation retained.
6. Level-up uses the woven mat and palm-leaf choices with raster illustrations. Tap selects visibly; ยืนยันวิชา applies the existing A/B option. Blessing subchoices and skipping remain available.
7. Card rewards use three illustrated cards on the woven mat, live owned counts, tap-to-read full mechanics and an explicit receive action. Skip remains available; short displays scroll. Card detail text uses darker ink. Conditional poison labels now say พิษ.

Existing command/reducer flow and balance retained. Victory intro still precedes level-up and card rewards. Package/signing/ABI unchanged; application source is now v1.0.12/code 13. The normal full Gradle build and native smoke workflow checks this release.

## Checks

- TypeScript passed; all 551 tests passed; web export passed before final font/contrast polish, then repeated for the final changes.
- Actual React Native web components were visually checked at 393×852 and 360×640 using a temporary route (removed, never shipped). Selected card heads were visible. Hand step was equal for 4/5 cards: 65.6875 px at width 393, 59.5 px at width 360. Level option confirmation and reward preview/accept callbacks passed at both sizes.
- Final corrections from inspection: explicit Thai fonts in level descriptions, visible light cowrie icon on dark slate, darker card-detail text and no rectangular background around selected palm-leaf art.
- Native smoke now captures selected level choices and reward card previews and asserts illustrated reward controls are present. First build: https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37608839611 . This run precedes final font/contrast polish; do not present it as the final APK.
- Final APK and native emulator result are pending at the time of this handoff. Physical device testing is still required after download; web checks do not establish native clipping behavior.
