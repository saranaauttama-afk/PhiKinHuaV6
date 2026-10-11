# Five nights — v1.0.19 / Android code 20

The main menu now starts full campaigns rather than the three-fight episode. Every class plays five separately unlocked difficulty nights. Each night starts a fresh class deck and follows the same 15-fight / 7-rest-row route, with bosses at fights 7 and 15. Clearing a night unlocks the next for that class; old nights remain replayable. The campaign ends after 15 fights even with full HP. The old full-run secret boss path remains compatible outside the campaign.

## Progress and rewards

`phikinhua_journal_v1` persists separately from autosave. Successful full clears advance only sequential unlocked nights. Failed runs remain in history without advancing progress. Run IDs are credited once. The journal retains 60 recent results, their final draw decks and blessings, plus permanent per-class achievements and personal bests for final deck size, total valid card plays, and turns. It also counts combos, deck additions/removals, upgrades and combat HP damage.

A fifth-night win grants one claim: the class special card becomes eligible in that class's combat rewards, or the class special blessing becomes an additional starter choice. Another fifth-night win can unlock the other choice. Neither a repeated result nor a repeated claim grants extra rewards. The special card is never automatically added to the starter deck.

## Combat and balance

All campaign enemies choose legal multi-card hands from their real energy budgets, using public HP/status information rather than the player's hidden hand or draw pile. Existing five pilot ghosts retain their authored signatures. The other 23 ghosts/bosses now have separate mixed 15-card decks and four owner-specific cards, including poison, healing, multihits, weakening, summoning, corruption or fight-only curse pollution. Enemy entangle now blocks attack cards. Curse damage follows its stated flat-per-stack effect. Higher nights add HP and strength; nights 3–5 escalate faster, nights 4–5 give elite/boss starting block and a once-only boss half-HP awakening, and night 5 adds a boss energy point after awakening.

Fixed Thai blessing IDs that had descriptions but no active registry behavior. Free-card energy only spends its once-per-turn gate on an actual zero-cost card. Added the four class unlock blessings. Player combat statuses clear when a fight closes, so warrior strength and enemy debuffs cannot leak across fights. Free draw/defense cards ghost_dodge and dispel_ill exhaust for the fight, and spirit_whisper costs 1, preventing a reusable zero-energy attack/draw loop. Nun starts at 50 HP, heals 6 on victory and its ordered basic dharma combo refunds 1 energy.

`night-balance-v19.json`: 24 seeds × 4 classes × 5 nights × 2 combat policies = 960 complete real-card simulations. Both policies use identical preparation, route policy and reward rules; the random combat policy still benefits from that preparation. Night 1: public-board policy 85/96 wins, random-affordable 75/96. Night 5: 27/96 versus 13/96. All classes have winning fifth-night samples and no pilot stalls. These are regression/balance indicators, not evidence that a bot models human enjoyment. The pilot uses legal commands, real damage and public board state, with no synthetic player/enemy HP in balance runs.

## Art

All 28 monster/boss slots now have sprites (23 new transparent sprites). Four new class unlock card illustrations and a new decoded boss courtyard background match the coarse Thai one-baht comic palette. Enemy cards use their owner's sprite; player cards have explicit class/ritual/minion art mappings and native gray equivalents. Story interludes/events reuse appropriate existing scene illustrations. There are no missing monster portraits on the full route. Broader optional dedicated event/blessing illustration work remains listed in the art checklist. Generation prompts are in `five-night-art-prompts.json`.

## Validation

625 unit/integration checks, TypeScript, web export, and browser checks at 393×852 and 360×640 passed before release preparation. Coverage includes all 20 class/night route combinations, terminal stats, save/resume metrics, sequential progression, isolated class rewards, concurrent journal writes, storage failure/retry and JSON blessing behavior. Browser tests exercise the real menu/class/night route, locked tiers, map reload, per-class journal, first reward claim/persistence and all four regular route boss sprites with decoded images and correct rage details.

The Android workflow builds an offline arm64/x86_64 universal release APK, audits signing/package/16KB alignment, and runs real native menu/night/journal/battle/pause/resume/victory/reward/full-route advancement and medium-helper UI smoke. Native build outcomes are reported separately after the Actions run completes; physical hardware has not been tested.
