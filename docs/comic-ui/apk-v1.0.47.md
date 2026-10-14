# Comic UI + audio playtest — v1.0.47

Owner requested an APK after reviewing the UI and reporting unreliable upward card drags. Build from `work/audio-sfx`, including all approved changes through `d9a2dfb`: selected-page close seal, subtly tinted card types and corner stamps, safe paper explanation margins, and the upward/diagonal drag fix. Audio integration remains present.

Version 1.0.47 / Android versionCode 48. App config and standard/audio workflow package checks and filenames match. The branch-triggered audio workflow performs TypeScript, a full native release build, package/signature/alignment/source/SHA256 audits, and the existing microphone-permission check. No unit, balance or emulator suite is added. The prior drag fix already passed four focused tests and touch-emulated browser checks at 360x640 and 393x852, including consecutive drags, cancellation, tap details and blocked cards. Drag feel still requires real-device playtesting.

The uncommitted local warrior image is not included; the build uses the approved artwork already committed to the branch. No gameplay or balance changes and no main merge.
