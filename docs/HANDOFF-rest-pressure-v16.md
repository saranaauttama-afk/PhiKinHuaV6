# v1.0.16 / Android 17 — rest choices and enemy pressure

Branch: work/occupation-table. Builds on verified v1.0.15 run 37658871240 (APK audit and API 36 emulator both succeeded).

## Behavior

- Both chapter rest rows preserve their route position when entering an activity. Completing a shop/event returns to the same choices; only Proceed leaves the rest row. Finished activities remain visibly disabled. No new command or save schema.
- All destinations share one non-wrapping row, with measured equal widths and visible names/descriptions. Shops and story activities render immediately after a tap. Returning to a visited rest scene skips its camera arrival; new rest rows still use the existing 2.6-second arrival. A new run clears that UI marker.
- Rest 1 has lantern event and equipment shop; episode equipment prices are quarter of full-run prices, with 15-cowrie minimum. Rest 2 has healing, upgrades and a 15-cowrie blessing event. Blessing is randomly awarded once, without duplicating owned blessings. Full-run shop prices remain unchanged. Episode level-up pairs omit equipment-slot growth.
- Enemy budgets are 2/3/4 across the three fights. Hands are 2/3/3, synchronized with the actual deck configuration. Costs constrain play; four energy does not require four cards. HUD explicitly labels the ghost's per-turn power budget. First-stage max energy was already two in v15, so the playtest's reported one was not verified as the configured maximum.
- Finale deck includes a defensive card; strength lasts two turns rather than accumulating for an entire long fight. This offsets the increased budget without removing pressure.
- Enemy cards reveal at 200x270, with 100px raster art. Five signature illustrations remain; all other authored chapter enemy IDs map to existing ghost illustrations. These are reused portraits, not newly generated individual skill art. The small cross-like blessing back is replaced by the ghost drawing.
- Discard selection uses full card art, summary and selected label on the woven mat. Ending shows the scene and dark cloth summary, removes repeated title and episode-only irrelevant secret-boss row. Healing/upgrade reuse their v14 themed surfaces, now without another arrival or confusing travel label. No delete control is present.

## Verification

TypeScript and final web export checked. 566 tests, including new actual-command rest sibling preservation, one-time blessing payment and award, 2/3/4 budget/deck synchronization, and 100 seeded checks excluding empty-slot upgrades. Existing cold-restore tests retained.

Playwright rendered actual React Native web components at 360x640 and 393x852: both rest rows have aligned, visible bounds; shops open without arrival delay; discard selection works; ending and enemy reveal inspected. Temporary QA route removed before final export and commit. Android build/native result must be reported separately when Actions completes.

Balance evidence: 160 fixed-policy runs skipping all upgrades and new rest benefits: warrior first-affordable 36/40 (mean final HP 18.3), board-policy 30/40 (15.6); medium 22/40 (8.9) and 17/40 (8.5). Losses count as HP zero. Deliberately limited pilot completion floor now 40%, reflecting requested harder play rather than the prior 60% floor; these are not human win rates. The all-class episode driver now uses real level-up choices, one upgrade and blessing preparation; shaman completes 5/8, warrior 8/8, nun 7/8, medium 8/8. Shaman floor changed from 6 to 5; others retain 6. Its slower starter remains a tuning candidate. No simulated HP/damage bonuses were added. Further human playtesting is needed, particularly medium and shaman.

Start a new run for new authored destinations and balances. Existing saves retain stored journey/card data.

Source commit: `705ae550ed96c5fe4901195ec3ffcc15553c2447`. APK/native Actions run: https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37695456405 (pending at push).
