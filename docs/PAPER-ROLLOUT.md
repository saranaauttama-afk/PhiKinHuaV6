# Paper Diorama production rollout

Integration branch: `work/paper-diorama-rollout`. No merge to main.

## Baseline audit

`main` (`98bda808`) → `work/hand-balance-v33` (`3d76e9ed`) → approved prototype (`1dc7a4e`). Both comparisons are ahead-only, seven commits each. Integration starts at the latest v33 gameplay baseline and fast-forwards the existing prototype; no ambiguous gameplay conflicts. Engine, card definitions, equipment, blessings, save migration, campaign and difficulty rules are preserved byte-for-byte.

## Milestone 1

Production village route and battle use the approved paper renderer and Settings switch. Entry identity is independent of turn updates; battle geography is frozen for the lifetime of the fight, including rewards. Shared values perform the three-second assembly without per-frame React state. HUD remains a screen-space sibling, and interaction is blocked until assembly finishes.

A configurable 4% requested downward shift adjusts the floating character's ground reference. The shift is limited when necessary to keep the entire cutout eight pixels above the enemy HUD. Short screens cannot accommodate a full 4% shift without changing the approved HUD; the actual permitted shift is smaller. The original art, natural aspect ratio and negative floating offset are preserved.

Inventory audit: 24 distinct environment images under `assets/scence/journey/thai-v24`: 16 primary locations including the secret throne, and eight rest locations. Episode aliases reuse five of those assets. Menus, character selection, chapter illustrations and reward mats are UI/story artwork outside route/battle geography and will remain unchanged.

Validation: TypeScript and all 930 unit tests passed. Production save-resume/discard/next-turn checks are run at 360×640 and 393×852 before this milestone is pushed.
