# Owner playtest fixes — 17 Oct 2026 (APK 1.0.67)

The owner played นักมวยคาดเชือก on 1.0.66, listed these UI fixes one by one, and approved them all ("แก้ได้เลย"). UI only: no game rule or number changed.

| # | What the owner asked | What changed | Where |
|---|---|---|---|
| 1 | ข้อมูลผู้เดินทาง: show up to บุญ only, keep the rest a mystery | Removed "ถึง 4 ได้พร · ค่าทั้งสองเลือกผีคืนที่สาม" and "ถ้าคืนที่สามมาถึงตอนนี้: …" (the night-3 ghost is now a surprise), removed "พรติดตัว" (already in the deck page's พร tab) and the map-skill line. `AlignmentMeter` is used in its `compact` form there. | `app/components/PlayerStatusBar.tsx` |
| 2 | ครูต่อท่าให้ on the HUD as an icon; glows when ready, dark once used | The class's map skill (slot A) is a seal at the end of the map HUD stat row: glow disc when ready, 45 % opacity plus the cooldown count when not. Tap opens the existing `SkillSheet`. Art per class in `mapSkillArt`. | `PlayerStatusBar.tsx` |
| 3 | Two right HUD icons opened the same page | มือสูงสุดท้ายเทิร์น and จั่วต่อเทิร์น each open their own one-line explanation instead of both opening ข้อมูลผู้เดินทาง. | `PlayerStatusBar.tsx` (`STAT_HELP`) |
| 4 | Ghost speech: round comic balloon | New `SpeechBubble`: SVG hand-drawn oval sized from the text, tail up at the ghost. | `app/components/battle/SpeechBubble.tsx`, `GhostTalkOverlay.tsx` |
| 5 | Our answers higher, each its own balloon | Answers sit 52 px higher (clear of the item row above the HUD) and each is an oval balloon with a tail down toward our portrait. | `GhostTalkOverlay.tsx` |
| 6 | Fonts did not match | The ghost line used THSarabun (`font.body`) while the answers used Prompt; the line is Prompt (`font.ui`) now. | `GhostTalkOverlay.tsx` |
| 7 | Shop labels ไพ่ทดแทน / ตัวปูทาง / ไพ่หลัก / ตัวเสริม unclear | Labels are tappable (underlined, ⓘ) and open a short explanation (`ROLE_HELP`), written from what `src/core/shop.ts` actually does with each slot. | `app/components/ShopView.tsx` |
| 8 | Equipment: worn from the deck page only | Removed the "เตรียมเครื่องราง" picker before every fight. Fights start with the deck-page loadout (`map_pages.ts` already falls back to `loadoutIndices`). | `app/index.tsx` |
| 9 | Card shop: don't announce what was bought | Card and equipment shops no longer show the reward receipt ("ได้รับ …", "เบี้ย -20") or the "ซื้อ … แล้ว" notice. The receipt pushed the shop panel down, and the purchase confirmation shrank the list; the confirmation now floats above กลับจุดพัก instead. Other shops (chests, shrines) keep the receipt. | `ShopView.tsx` |
| 10 | Deck page: no clickable type filter; show cards in groups | The filter chips are gone. All cards show at once, grouped with a plain text heading per type; เครื่องราง first, the rest in `CARD_TYPE_ORDER`. | `app/components/DeckView.tsx` |
| 11 | พักยก banner not noticeable, sat on the ghost | Full-width band across the middle for ~2.2 s: bells and a big "พักยก", "จบยก N · เทิร์นหน้าเริ่มยก N+1", what fired, and the one-line rule (every `roundTurns` turns is a round; bell cards get their bonus on the round's last turn). หมอผี's ผนึก/สายสิญจน์ notes keep the old small plate (`noteBanner`). | `app/battle.tsx` |
| 12 | Does any class besides นักมวย have พักยก? | The engine counts rounds for every class (blessings with a `roundEnd` trigger still fire for anyone), but the ยก badge was already fighter-only. The พักยก banner now shows only for classes with rhythm (`usesRhythm`), i.e. นักมวย. Owner considered removing ยก and decided to keep it, only make it clearer (#11). | `app/battle.tsx` |

Review harness: `app/ui-review.tsx` gained `talk` and `traveler` screens; `scripts/review-fixtures-1017.ts` writes fixtures for `traveler`, `shop-card`, `deck`, `talk` into the web export dir (`EXPO_PUBLIC_UI_REVIEW=1 npx expo export --platform web`). Checked at 393×852 in headless Chromium; still needs a look on the phone.

Verified: `npx tsc --noEmit`, `npx vitest run` (55 files, 741 tests).
