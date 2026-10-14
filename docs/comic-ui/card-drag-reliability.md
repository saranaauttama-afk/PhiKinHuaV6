# Battle card drag reliability — 14 Oct 2026

The player reported having to push a card upward four or five times before it played. The previous recognizer required more than 90 points of upward travel and less than 55 points of sideways travel at release. In touch-emulated browser checks, a 75-point upward drag and a 125-point upward / 70-point sideways diagonal both left the attack in hand at 360x640 and 393x852. A long straight upward drag played it. The fixed sideways cutoff rejected an otherwise clear upward diagonal.

The hand now recognizes upward movement after 8 points, with a 36-point pre-activation sideways allowance and a 12-point downward failure boundary. Release requires predominantly upward travel (at least as far up as sideways) and a distance proportional to card height, bounded to 44–58 points. The recognizer consumes some movement before activation, so that margin also accommodates ordinary short drags on taller cards. Decorative lift is excluded. Dispatch still happens once on a successful release; cancellation returns the card to the hand. Tap details and the explicit use button remain available. Costs, turn locks, prayer selection and gameplay effects are unchanged.

Validation:

- TypeScript and four focused regression tests for drag intent passed.
- Actual PlayerHand/Card/GestureDetector plus the combat reducer were tested with dispatched touch input at 360x640 and 393x852.
- Short upward, long upward and left/right upward diagonals each played one card and applied the expected five damage. Small movement, sideways movement, downward movement and a retracted short drag did not play a card.
- Follow-up checks cover touch cancellation, three sequential drags without reloading, tap-to-details/use, and a card blocked by insufficient AP.
- These are browser touch-emulation checks; Android device confirmation remains for the next requested APK. The browser still reports the pre-existing audio play/pause interruption; audio code is unchanged.

No APK, version bump or workflow run is requested. The commit uses `[skip ci]` and stays on `work/audio-sfx`.
