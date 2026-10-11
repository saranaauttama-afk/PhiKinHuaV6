# v1.0.21 / Android code 22 — พระประธาน playtest card

Branch: art/quiet-comic-ui. User requested no further screenshot capture.

The Android test APK enables EXPO_PUBLIC_TEST_WIN_CARD=1 during bundling. Every class gets one extra พระประธาน skill card in the first hand of each fight. It costs zero, is exhausted after use, sets enemy HP to zero regardless of block, and uses the normal victory settlement, rewards, level-ups, route advancement and credited ending. It never enters the master deck or reward pool. The ultimate fight still occurs after the fifth-night boss. Normal builds without the flag do not deal the card; even a restored test card cannot win with the flag disabled. Existing combat saves obtain the card on their next fight.

Validation: all 651 tests passed, including actual card-driven full runs for all twenty class/night combinations, mandatory ultimate boss, zero energy, high block, save restoration, duplicate/later-turn prevention and disabled flag. TypeScript passed. Android JS export uses the enabled flag. No screenshots were taken. CI web captures were removed; native CI now only installs and launches, without gameplay screenshots. Device gameplay remains for the user's manual testing.

The v20 build failed in AAPT2 PNG compilation; this build disables release PNG crunch and increases Gradle heap/metaspace. APK build/signature/package/16KB audit and installation results are pending CI, not claimed as passed.
