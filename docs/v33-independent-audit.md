# v33 independent regression audit

Scope: remove explicit combo tracking and rewards, retain ordinary card interactions, and preserve v32 saves. No APK build or merge is authorized for this release.

`test/v33-removal-audit.test.ts` adds 50 regression cases:

- All 38 former combo prerequisite cards produce a useful runtime effect when played individually. The assertion excludes energy payment and moving the played card, so a no-op cannot pass.
- Warrior Block/riposte, shaman Curse/needle, nun Block/wheel and medium Poison/echo continue to work without the old reward. Curse's existing +1 damage modifier remains part of the shaman result.
- Old battle payloads cannot provide free cards or debuff immunity. Obsolete run metrics are dropped while unrelated metrics survive.
- The five previously empty legacy card payloads are converted on cold load; card identity, names, upgrade levels and paid cost reductions survive. Repeated save/load does not reapply the conversion.
- Progression and unrelated journal unlocks survive. Retired commands, notifications, books and runtime imports are absent.

An additional journal fix counts only current achievement definitions in the visible total. An old saved `combo_keeper` identity can remain in history without producing an impossible count such as 6/5.

The supplemental suite passed all 50 cases locally. The full local run passed 885 cases across 48 files at that checkpoint. Final release verification and current totals belong in the v33 handoff and the branch's web verification workflow.
