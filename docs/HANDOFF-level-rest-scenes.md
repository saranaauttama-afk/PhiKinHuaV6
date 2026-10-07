# Level rewards, rest services and scene audit — v1.0.14 / code 15

Follow-up to physical-device playtest screenshots 25587/25589/25590/25591. Branch `work/occupation-table`.

## Findings and changes

- Level 3 “ปลุกเสก” used to apply the default first deck index silently. It now opens an illustrated picker, preserves the actual deck index, shows current/upgraded mechanics and requires an explicit local confirmation. Remove-card rewards also require a target. HP rewards already added 8 max HP/healed 8; regression coverage now asserts exact values and visible results. The reducer records the actual reward result with fight number, displayed above card rewards, so stale results cannot appear on a later fight. Invalid explicit card indices leave the level reward unconsumed.
- Rest knife labels existed but percentage widths wrapped into a vertical stack on the physical device, placing the knife label behind the HUD. Destinations now use measured numeric widths; whole illustrated destinations and labels scroll above reserved HUD space.
- Upgrade/healing services used the old full parchment web panels. They now use illustrated mat/shrine scenes with arrival motion, a quiet dark cloth panel and raster cards/controls. Upgrades show before/after mechanics and cost. Confirmation sits inside the selected card so no search for a far-away bottom action is needed. Shrine shows actual remaining HP, currency, cost, uses and successful healing.
- “ทำลายทิ้ง” dispatched DeleteShop: permanently deleting the destination, not a card. Removed from the service UI; one เดินทางต่อ retains CompleteNode. The underlying legacy command remains unchanged.
- Scene audit: map followed destination rows, but fight 2/finale reused the same house image; battle always used one village image. There are now five distinct map destinations, and battle uses the visited node’s arena (not the next reachable rest). Existing 2.6 s travel + 0.45 s fade retained. Services own arrival presentation. Background zoom is clipped in a dedicated backdrop wrapper so focus/scroll cannot move live controls horizontally on web. Returning from a service follows the existing route progression.

| Row | Location | Scene asset |
| --- | --- | --- |
| 0 | First fork/fight | `assets/ui/map-crossroads.jpg` |
| 1 | Lantern event | `assets/scence/lantern-hut.jpg` |
| 2 | Second fork/fight | `assets/scence/episode-village.jpg` |
| 3 | Shrine/upgrade rest | `assets/scence/rest.jpg` |
| 4 | House finale | `assets/scence/menu-haunted.jpg` |

No new artwork or balance changes. The unused legacy boss.jpg failed local image decoding and was not wired into the new presentation.

## Validation

555 tests cover selected-card upgrades, exact HP rewards, invalid target preservation and distinct route scenes/current battle stage. TypeScript and final web export passed before push. Actual mobile web components were exercised at 393×852 and 360×640 with real reducer commands: selecting the second card + free level upgrade, service upgrade, healing and direct knife entry. Checked both destinations stay side by side with labels visible; upgrade card controls stay inside the viewport after purchase. Temporary QA route removed before final export/commit.

Native smoke now confirms a real level stat choice rather than only skipping it. Existing APK signing, ID, ABI and package audit remain unchanged. New APK/native result pending; physical device follow-up still needed. Previous v1.0.13 build/native validation passed (run 37638483159).

## Final build

Source commit `b42e1b43cfdda190ef7dc651ba4c8e8cfa08c461`. Final APK/audit/API 36 smoke run: https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37652373221 . In progress at handoff; check the run before presenting an APK as verified.
