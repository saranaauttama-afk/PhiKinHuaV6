# NOTFM enemy deck depth — research follow-up, 16 October 2026

## Question and evidence boundary

The owner reports that NOTFM's opponents feel as if they carry larger decks, with more options as they grow stronger. We adopt that design goal for PhiKinHua. We **have not established exact per-monster physical deck counts for the current Classic release**, and the deck sizes below are our implementation choices, not asserted copies of NOTFM values.

The two 13 October reports remain the design foundation. Their counts describe older snapshots. Classic/Full Moon is the comparison target; do not mix its numbers with Mirror, Wishing, Treasure Battle, Diaries or their separate versions.

## Source check performed on this pass

| Source | Accessed | What it establishes | What it does not establish |
|---|---|---|---|
| [Giant Games' Steam store](https://store.steampowered.com/app/769560/Night_of_Full_Moon/) | 16 Oct 2026 | Developer/publisher identity, adventure deckbuilding and turn-based combat; separate named DLC/modes are listed | Exact current enemy decks, copies, draw or retention rules |
| [Official game website](https://www.yueyuanzhiye.com/landing/) | 16 Oct 2026 | Official entry point; attempted retrieval for more specific rules | Retrieved content did not provide a reliable Classic enemy-deck table |
| Community pages for [Snow Monster](https://night-of-the-full-moon.fandom.com/wiki/Snow_Monster), [Phantom](https://night-of-the-full-moon.fandom.com/wiki/Phantom), [Treant](https://night-of-the-full-moon.fandom.com/wiki/Treant) | 16 Oct 2026 | Search results point to per-enemy deck/stat sections, useful leads for later play verification | Full pages were blocked on retrieval; search snippets are not counted as verified physical deck counts |

A future verification should record platform, game version, Classic chapter/difficulty, enemy name/level, a screenshot or replay of the actual deck view, and whether the count includes repeated copies, temporary/generated cards and phase-two changes. Several low-level and boss examples are needed before deriving a general rule. Do not turn an unverified community list of card identities into a physical copy count.

## PhiKinHua baseline measured from main

Base commit: `0df356181a654c2aa3bd8d6d028f1f06d0c9c5d7`.

- 34 owned enemy decks; 267 enemy card definitions, all used across normal and second-phase decks.
- First-phase decks contained 8–15 physical copies and 6–11 distinct IDs. Twenty-one of the 34 had only seven distinct IDs.
- 327 total first-phase physical copies across the roster; 254 distinct IDs in first phases.
- Normal enemies: hand 4, draw 2/turn, retain 2. Elite/boss: hand 5, draw 2/turn, retain 3.
- Both playable classes had 53 class cards, including one locked book reward each.

## Exposure matters as much as deck size

At two draws per turn, a fresh 20-card deck exposes at most six newly drawn cards in three turns, before retained cards occupy slots. Increasing copy count without considering fight length can hide the signature instead of creating tactical depth. A single signature is encountered in six draws with probability 6/N under a uniformly shuffled fresh deck; with K signature copies the probability is `1 - C(N-K,6)/C(N,6)`. Actual combat differs due to opening initialization, retention, early deaths, phase changes, recycling and fixed seeded shuffles.

Boss phase-two initialization uses a deterministic rotation based on elapsed ghost turns rather than a fresh random shuffle. The hypergeometric calculation above therefore applies only to the idealized fresh first-phase deck; it does not certify phase-two signature timing. Existing save piles and deterministic recycling also need direct tests.

Consequently the implemented growth uses 11–12 copies for early ghosts, 14–16 middle, 18 late and 18–20 bosses. Each adds actual themed identities, keeps existing main signatures, bounds oppressive effects and keeps phase-two decks compact at 14–16. Roster-specific rationale and exposure tests are in [GHOST-DESIGN](../../card-depth-2026-10-16/GHOST-DESIGN.md). These numbers remain subject to paired simulations and human play.

## Design translation

1. Every enemy has a recognizable primary threat, useful setup, a conditional payoff and some recovery/defense rather than copies of one generic attack.
2. Give the player counterplay using existing means: guard, cleanse, sweep, armor break, water/seal/uncharge, timing of heavy strikes and retaining cards.
3. More copies must not produce repeated hard-control locks. Do not add stun/theft/summon copies merely to fill the deck.
4. An AI choice must understand visible guards, minions and conditional setup. No access to player hand, future draws or RNG.
5. Balance evidence must report class and difficulty separately, alongside per-enemy losses and stalls. A larger content count alone is not evidence that the game is more challenging or enjoyable.
