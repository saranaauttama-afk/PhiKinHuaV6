# Readable rest and level choices — v1.0.13 / code 14

User approved implementation of the three-screen mockup on 2026-10-07. Branch: `work/occupation-table`.

- Level-up: two illustrated objects above dark fabric labels, reserved selection-mark space, one confirmation and a secondary skip. Existing A/B effects and blessing subchoices are retained. Short Thai descriptions no longer float over art or neighboring options.
- Rest map: compact journey strip, illustrated shrine/ritual knife/lantern destinations rather than miniature scene cards. Tapping enters immediately. One เดินผ่าน action with a small next-stop label replaces the intermediate แวะที่นี่/ข้าม buttons and duplicated proceed labels. All rest offer kinds retain their existing ChooseOffer and Proceed behavior.
- Story event: larger readable Thai text on a quiet cloth panel and painted objects on wooden choices. Risk effects are red. The selected outcome replaces story/choices in the same panel, followed by one เดินทางต่อ action. Both • and · label separators are supported; requirement locks remain visible.
- Player map HUD reduced from 128 to 112 px with reserved space reduced consistently; interactive links retain 44 px touch targets.
- Combat hand, previous post-battle victory/card rewards, balance, package ID, signing, ABI and safe-area behavior remain intact.

## Checks

TypeScript, all 551 tests and web export pass. Actual components were inspected at 393×852 and 360×640: selection + confirm dispatch, direct rest entry and choice-to-result replacement worked. Short-screen content scrolls above the reserved HUD. The temporary QA route was removed before export/commit. Android smoke now exercises the direct-entry path and asserts that intermediate rest buttons and previous story choices are absent. APK audit and API 36 native smoke passed in final run 37638483159; do not claim a physical-device test.

## Art

New built-in imagegen asset: `assets/ui/ritual-dark-cloth.webp`, used through measured RitualSurface with its stable native image parent. Existing illustrated objects and wooden/paper controls reused. Live text remains code-rendered. Prompt: “Single blank 3:2 panel of very dark brown charcoal woven cotton, rough frayed edges and modest ochre stitching; flat hand-inked crosshatching like a Thai 1970s one-baht horror comic, quiet dark center, transparent exterior, no frame, text, symbols, objects or glow.” Converted to WebP with alpha for APK size. Generated original retained outside the repo.

## Final build

Final source commit: `793e57feb7b8aa9ded35617276caccf1c24888cd`. APK/package audit/API 36 smoke run: https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37638483159 . Build, package/signing/16KB audit and API 36 native smoke verified successful on 2026-10-07. The earlier v1.0.13 run 37638172898 predates the native assertion helper correction; use the final run above. The native assertion helpers were verified locally against sample accessibility XML.
