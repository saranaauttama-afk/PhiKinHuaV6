# Comic UI + audio playtest — v1.0.48

Owner requested a fresh APK including the latest battle HUD and page reveal. Build from `work/audio-sfx` through `07bd3b0`: skills and blessing amulet moved inside the HUD next to a shorter health bar, a full-width scrolling status row, and scene-timed staggered page fade/grow with a transient warm glow. The earlier card-drag reliability fix and audio integration remain present.

Version 1.0.48 / Android versionCode 49. App config and standard/audio workflow package checks and filenames match. The existing branch-triggered audio workflow runs TypeScript, a full native release build and package/signature/alignment/source/SHA256 audits. No unit, balance or emulator suite is added. Prior browser checks covered twelve statuses and control geometry at 320x568, 360x640 and 393x852; page-reveal checks covered the actual map/shop flow, camera timing, no replay on selection and reduced-motion behavior. Native presentation still needs device playtesting.

The uncommitted local warrior image is excluded; the build uses committed artwork. No gameplay/balance changes and no main merge.
