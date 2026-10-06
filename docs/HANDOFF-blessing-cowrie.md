# Blessings on a wooden shelf and cowrie currency — v1.0.9

Application commit: `861aafa74b22e758e062fccf0fc60dd8be51fff4`.
Workflow: https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37416831768

Branch: `work/occupation-table`. User approved the wooden protective-object shelf and changing the displayed currency from ทอง to เบี้ย on 2026-10-06. User also queried the repeated icon on the start button; source confirmed it was an abstract lantern automatically added to every primary GameButton.

## Behavior

BlessingView uses an old dark wooden cabinet background with low lantern lighting. One grouped blessing appears centrally with a larger object; multiple groups form two columns. Real live names, descriptions and counts remain readable below the objects. Duplicate blessings show ×n. Every blessing receives symbolic artwork, with no Art placeholder: herbs for herbal wisdom, ancestor shrine for ancestor blessing, breath for meditation, existing ritual jar/knife for ritual shield/bamboo dart, and an amulet symbol for other protective/spiritual blessings. Shared symbols represent the blessing category; they are not unique illustrations for all twelve definitions.

Tap an object for a wooden detail view containing the live full description and duplicate count. Android back closes details; the close action returns to the calling map/battle. Empty collection retains the original explanation. Existing blessing stacking, rules and balance unchanged.

Displayed currency is เบี้ย in the player HUD, shops, victory reward, level-up choices, run summary, event results and insufficient-funds messages. Existing `gold` fields/command kinds/save values and costs remain unchanged. The SVG money-bag/dollar symbol becomes a cowrie-shell line drawing. กุมารทอง names and references are preserved.

GameButton no longer automatically adds the abstract lantern; primary actions have a forward arrow. The actual route stop illustrations remain lanterns. Buttons now use static Pressable styles and a permanently mounted measured paper image, preserving Android NativeWind/Fabric behavior. Accessibility labels retain the original action name.

## Production assets and prompts

Built-in imagegen produced four assets in `assets/ui/`:

- `blessing-shelf.jpg`: empty dark old protective-object wooden cabinet in a rural Thai house; weak left lantern light; quiet central backboard, bottom ledge; portrait 9:16; vintage cheap Thai one-baht horror comic coarse uneven black ink, faded ochre/brown print. No people, objects, text, paper or UI. Prepared as 900×1600 RGB JPEG.
- `blessing-amulet.png`: standalone triangular clay Buddhist amulet on curled red cord; near-black uneven ink, faded earthy ochre/sepia grain; transparent, no text/UI/background.
- `blessing-herb-object.png`: tied Thai healing herbs, leaves/roots/red thread and tiny wooden mortar; same coarse ink and faded olive/ochre print; transparent, no text/UI/background.
- `blessing-shrine-object.png`: miniature ancestor wooden spirit shrine with peaked roof, incense pot and faint smoke; same coarse ink and faded ochre/sepia/red print; transparent, no text/UI/background.

Object files preserve alpha, cropped to their nontransparent bounds and fitted without stretching into 320×320 canvases. Original generated sources are scratch only; production files are tracked in the repo.

## Validation

Local TypeScript, all 543 tests in 33 files, diff whitespace checks, Python smoke compilation and Android bundle export passed. CI TypeScript and 543 tests passed; APK build and audit passed. Android API 36 full native smoke also passed. Native screens were downloaded and visually inspected.

APK: https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37416831768/artifacts/11391163420

APK SHA-256: `863cfb600833603a694a2120d274a1ad76eb0c5a87ff15edea81a3815ab97ec6`.
Certificate SHA-256 unchanged: `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
Package `com.phikinhua.episode`, version `1.0.9`, code `10`, minSDK 24, targetSDK 36, ARM64/x86_64. Signature v2 and 16 KB checks passed.

Native smoke additionally checks the new currency label on the initial HUD and opens/closes the live starter blessing detail before returning to the map. Dedicated Blessing-Cowrie-native-screens artifact contains cover/map/blessing/detail screens and the full regression result. The full existing smoke still covers occupations, starter blessing, map/deck/player links, ghost selection, battle and rewards/rest/event. Multi-blessing arrangement and duplicate count are implemented but not forced into the native first-chapter flow. Physical device not tested by the assistant.

## Native result

Evidence: https://github.com/saranaauttama-afk/PhiKinHuaV6/actions/runs/37416831768/artifacts/11391359140

The actual starter selection granted พลังวิญญาณ in this run. Native smoke tapped its shelf object with valid bounds, opened the full live description, returned to the collection and then closed back to the map. The initial map contained เบี้ย 25 as asserted. Existing full regression passed all four occupations, compact starter blessing, player details, deck/card details, ghost selection/switch/deselect, card preview/play, enemy turn, victory/rewards, rest/event and next location. No fatal crash/ANR/offline bundle error was reported.

Visual inspection confirms: menu primary button reads เริ่มเกม → with no abstract lantern; cowrie symbol and เบี้ย 25 fit the compact HUD; a single amulet sits centrally inside the dark cabinet with readable name/effect and no placeholder; full blessing details use the wood surface with readable live effect and an operational return control. Multi-blessing/duplicate arrangements were not forced into the native smoke. Physical device not tested by the assistant.
