# Page fade, grow and warm glow — 14 Oct 2026

The owner requested a visible fade-in and glow-up when adventure pages appear. Previously the 230 ms fade could finish while SceneArrival still hid the choices behind its camera arrival. Pages then appeared fully opaque when the parent finally revealed them.

SceneArrival now publishes a presentation-only content visibility context. Each page waits until the scene starts revealing its content, then plays a 620 ms opacity fade, a subtle scale from 0.94 to 1 and a 12 px upward settle. The three pages are staggered by 80 ms. An existing candle-halo texture glows briefly at low opacity and fades to zero; no art is regenerated and no persistent selection glow is added. Only the individual slot's mount or the existing appearance key triggers its entrance; changing one slot no longer replays all remaining pages. The existing return-to-map appearance key is preserved.

Reduced-motion mode sets final values immediately, without glow or scale travel. Page interaction and accessibility remain disabled until the page entrance completes. Effects stop on unmount or replacement. The context does not dispatch gameplay commands or introduce new scene travel.

Validation: TypeScript and whitespace checks passed. Browser checks on the actual StartPage/map/shop flow recorded intermediate opacity and scale, transient glow, final interactive state, no replay when merely selecting a page, replay after returning from the shop, deferred reveal during a new scene arrival, and immediate appearance with reduced motion enabled. A short preview GIF was captured from the actual map UI. The existing browser audio interruption remains outside this change.

Push to `work/audio-sfx` uses `[skip ci]`; no new APK is requested for this follow-up. Current v1.0.47 predates this and the preceding HUD arrangement change.
