# Head-stealing campaign — v1.0.20 / code 21

Source: `a954931edbe28425cdf7c1534ef25bf41a39a98a`, branch `art/quiet-comic-ui`.

## Story and bosses

Sleeping adult villagers lose their heads but stay alive. Restoring their heads before dawn wakes them. Night-specific openings, gates and endings replace the missing-child premise, with two dedicated hut illustrations.

| Night | Final boss | Signature |
| --- | --- | --- |
| 1 | คนแบกหัว | Weakens attacks |
| 2 | เงาระฆังร้าง | Pollutes the hand with curses |
| 3 | เจ้าดงรากผี | Summons forest spirits |
| 4 | นางเฝ้าถ้ำ | Recovers health |
| 5 | เจ้าไร้เศียร | Multiple attacks and awakening |
| After night 5 boss | ผีกินหัว | Ultimate curse source |

All six have unique transparent sprites and owner-specific mixed decks. Night five always appends the ultimate fight, even at 1 HP; no victory report or progression credit is granted until that fight is won. Nights one to four remain fifteen fights with seven rests. Night five is sixteen fights with seven rests. Saves preserve campaign metrics and fixed pending boss identities.

## Journey and five-screen repairs

Fifteen distinct backgrounds: moonlit village, village edge, temple gate, temple court, cremation ground, bamboo forest, banyan grove, stream, waterfall, mountain trail, mountain shrine, cave mouth, underground river, buried sanctuary, otherworld gate. Seven separately illustrated rest scenes and an ultimate throne follow the destination rather than the old repeating modulo scene selection. Fight indices account for interleaved rest rows.

Blessing objects are smaller and their effects visible. Defeat uses haunted scenery behind parchment. Events display their rest location. Energy and hand upgrades use compact relevant symbols. Fusion uses dark panels with light text, two columns and parent scrolling. Surfaces have appropriate backing colors during image loading.

## Validation

- GitHub Actions: all 629 unit/integration tests, TypeScript and web export passed.
- Structural campaign tests cover all twenty class/night combinations, five fixed boss identities, low-HP mandatory ultimate progression and sixteen-fight credit.
- Mobile web workflow run 37792936120 passed actual menu/class/blessing/battle/victory controls, remaining production screen fixtures and fifteen save-restored legal route screens at 393×852; smaller screens checked at 360×640.
- Visually inspected all fifteen route images and the reported blessings, defeat, event, level-up and fusion screens. No missing scenes, unreadable fusion text or mismatched oversized upgrade illustrations remained.
- Android build/audit: run 37792936061, pending at time of this draft.
- Physical hardware has not been tested.
