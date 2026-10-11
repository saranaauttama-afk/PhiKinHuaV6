# Quiet comic UI — first web review

Branch: `art/quiet-comic-ui`, based on five-night v1.0.19 commit `bcc0623`. User approved the four generated screen concepts on 2026-10-08 and asked for real-game visual review before APK builds.

## Implemented first iteration

Battle separates the ghost artwork from its narrow health/block/turn/status strip below. Player vitals and the spirit pot share one compact slate at the bottom. Wider hand cards reveal approximately three/four readable cards and scroll for the rest; short screens use smaller art. Detailed card reads, legal drag/tap plays, opaque gray unplayable cards, turn sequencing and piles remain live. Helpers and statuses use bounded scrolling rows. Post-battle hand/status clutter is hidden during the victory introduction.

Map uses illustrated paper choices, a shared bottom player HUD and an expandable full-route trail. Actual route offers remain authoritative: battle rows still offer ghosts and rest rows still offer activities; this does not introduce mixed route offers from the concept drawing. Rest entry remains one tap. Starter blessings now use horizontal illustrated options, one selected description and explicit confirmation. Victory consolidates real enemy name, rewards and XP onto one illustration sheet; its character art follows the actual class.

Two new reusable raster assets: `quiet-village.png` and `quiet-slate.png`. The existing card/class/ghost illustrations are reused. The generated compositions are design references; implementation is a first review iteration, not a pixel-perfect recreation of the drawings. In particular the victory sheet uses existing class artwork rather than four new victory scenes. Other menus remain on the previous style for later review.

## Web-before-APK workflow

The branch does not match any automatic Android build trigger. `web-visual-preview.yml` exports the real Expo web game, checks TypeScript/tests, navigates actual menu/class/night/blessing/map/battle screens in Playwright and uploads screenshots plus the web export. It does not host a public play URL or build an APK. Screenshots are in `docs/previews/quiet-comic/`.

Local reproduction:

```sh
npm ci
npx expo export --platform web --output-dir /tmp/quiet-web
npm install --no-save playwright@1.62.1
npx playwright install chromium
npx vite-node --config vitest.config.ts scripts/quiet-preview-fixture.ts
node scripts/preview-mobile.cjs
```

`PHIKINHUA_WEB_DIR` can override export directory. `PHIKINHUA_CHROMIUM_PATH` can select an installed browser. The near-win checkpoint is produced entirely by legal engine commands; the final winning card and reward continuation run through the real battle UI. It is a visual fixture, not balance evidence. Browser contexts are isolated and do not touch user saves.

## Verification and remaining checks

625 tests, TypeScript and production web export passed. Live web flow verified at 393×852 and 360×640: menu, class/night, disabled confirmation before selecting a blessing, actual granted blessing, ghost selection/entry, card details/close, a real card win and reward continuation. Browser page errors fail the script. No Android build or physical-device verification was run for this UI branch. Before the eventual APK smoke, update native selectors for the new blessing confirmation and `รับรางวัล` victory button.
