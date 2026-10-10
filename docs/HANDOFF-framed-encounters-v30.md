# Framed circular encounters — v1.0.30 / Android code 31

Branch `work/final-tuning-v29`, based on 223474d6. User approved the framed design in chat on 10 October 2026 (“เอาแบบนี้ แก้เลย”). This supersedes the previous free-standing adventure encounter presentation only. Ten-ghost nightly routes, service spacing, enemy decks, archive and save schema from v29 remain active.

## Implemented

Three equal vintage dark illustrated frames contain the title, an equal-sized circular picture, a short public trait/service clue and the local action. Selecting the title/portrait/clue region only selects the offer; a separate sibling button inside the same frame confirms entry. No nested pressables/buttons, no global confirmation ribbon and no vertical candle selection beam. Stable fixed title/clue/action bands prevent jumping on selection and allow long Thai names to wrap to two lines. Portrait/prop circles clip the original artwork using native layout. Sprite files are never overwritten. Flame spirits have distinct focal positions so their faces remain visible. Service objects use the already audited shared map/destination mapping.

Frames scale to viewport width with three columns retained even when other slots are empty. The row is placed above the center, leaving atmospheric space below. Next Intersection is a compact 44dp control; its existing skip/defer confirmation remains. Map HUD height is 76dp (from 88dp); portrait, HP, left-aligned resources and deck/blessing controls remain. Battle HUDs with statuses/blessings keep their existing height. Removed top map/battle text stays removed. No enemy intent is shown; trait clues describe persistent mechanics only.

## Artwork

One new built-in imagegen asset: `assets/ui/encounter-frame-v30.webp`, transparent outside an opaque charcoal panel. Approved mockup was the style reference. Original generated PNG kept separately; production copy converted to WebP with alpha preserved, maximum width512px, quality90. Existing ghost and service art reused; no ghost, card or background regenerated.

Final prompt: “Create ONE empty reusable encounter panel FRAME asset closely matching a single dark vertical panel in the approved reference. Isolated on a truly transparent background, upright tall narrow aspect ratio approximately 1:2.3. No scene, characters, objects, lettering, numbers, circle, portraits or buttons. Only the panel's textured dark charcoal near-black interior and delicate irregular weathered ochre ink outer border. Cheap vintage Thai ghost-comic hand-drawn visual style, subtle old palm-leaf/wood texture, small pointed Thai leaf-like crest centered at top and bottom, clipped gently jagged shoulder corners, thin doubled uneven worn ochre border along both sides. Symmetric overall geometry. Whole panel visible with small transparent outer margin approximately2%. Large quiet nearly black interior. No Western bats/crowns, Chinese motifs or skulls. Keep interior opaque and outside transparent.”

## Verification

Local full suite: 753 tests / 45 files passed. TypeScript and production web export passed. No game screenshots taken. DOM QA uses actual encounter components with the real map HUD reservation; checks equal frames/circles, clipping, local44dp action containment, frame/HUD separation, distinct matching service art, select/confirm/return/skip and real upgrade levels. The v29 strict selector ambiguity is corrected with `adventure-enter-1`. Existing API36 native route/resume/archive checks run on the new APK.

Current v30 remote mobile checks, signed APK audit and native results are pending. v29 Android/native success is historical evidence, not validation of v30. See final-tuning-v29-pilot.json for the unchanged320-run gameplay report; shaman pace and human fun/one-hour nights remain open playtest items. Audio and Closed Beta are the next phase. QA APK still contains the authorized พระประธาน structural testing card.
