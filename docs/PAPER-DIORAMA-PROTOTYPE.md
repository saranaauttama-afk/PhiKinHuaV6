# Paper Diorama: one route, visual approval only

Branch: `work/paper-diorama-prototype`. Continue the existing village composition and original `phi-nang-yai` ghost (content name: ผีตายโหงเรือนร้าง). No original scene bitmap or ghost artwork was regenerated or overwritten.

Opt-in production route: export with `EXPO_PUBLIC_PAPER_DIORAMA=1`, open `/paper-diorama`. Choose the ghost and enter the village. The previous push-in is replaced by independent paper assembly: sky 0–300 ms, forest 300–650 ms, village 380–700 ms, ghost 700–1100 ms, foliage 1100–1500 ms, fixed HUD/cards fade 1500–1800 ms. All scales stay at 1; the ghost rises 54 logical pixels. Interaction unlocks at completion. Ambient drift after assembly is at most one logical pixel, on a slow 32-second cycle. It stops with reduced motion or background visibility. No sequence replays on card/turn updates.

Settings contains **ฉากประกอบเคลื่อนไหว (Diorama Animation)**, ON by default. OFF or either game/OS reduced motion enters an assembled battle immediately. It uses `phi-ui-settings`, preserves unrelated stored fields, serializes writes, and waits for settings/system hydration before presenting the scene. There is no skip control, prompt, or animation overlay.

Four transparent `*-ink.png` overlays cover only warm cream edge pixels near source alpha boundaries. The existing irregular cut contours provide the ink stroke; depth-specific reach controls thickness. A narrow paper bevel and offset shadows remain. The originals are still the actual rendered artwork, with separate overlays; interior textures and composition are unchanged. The optional authoring script `scripts/paper-ink-masks.py` derives overlays deterministically, requiring Pillow/numpy only for regeneration of those masks, not at game runtime. The ghost uses a dark rim instead of the former cream rim; its source bytes are unchanged.

Reanimated shared values drive assembly without per-frame React commits; web transform compositing is enabled. Asset loading gates entry to avoid late image flashes. HUD and cards are siblings of the world with no camera transform ancestor. Completion callbacks have generation guards and animation cleanup. The four original full-resolution textures plus four full-resolution masks use approximately 48 MiB decoded before actor/UI textures; Android device profiling remains pending visual approval, and no APK is built for this task.

The preview keeps the same local reducer state and commands as the previous prototype. It never saves a run or progression. Gameplay, balance, cards, blessings, standard battle geometry, normal backgrounds, and campaign are unchanged.

For a portable Web Preview, `scripts/export-paper-review.py` temporarily selects `preview/paper-entry.tsx` and always restores package.json. This mounts the **same prototype component** directly. `scripts/bundle-paper-review.py` embeds the required fonts, scene/HUD assets and complete preview starter deck into one HTML file. Download and open it in a browser; it requires no server or network for this scene. This is a downloadable Web Preview, not a publicly hosted URL.

Validation and complete changed-file list: [PAPER-ASSEMBLY-DELIVERY.md](PAPER-ASSEMBLY-DELIVERY.md).
