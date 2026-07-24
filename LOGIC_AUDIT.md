# Nightfall Logic Audit

## What Now Checks Out

- The deck is normalized to exactly `players + 3` cards before dealing.
- A real `Werewolf` and at least two `Villager` cards are preserved in the dealt card pool.
- The night queue is built from the actual in-game cards instead of the raw lobby deck.
- Empty role phases are skipped automatically.
- Multiple players with the same waking role can all act before the phase advances.
- Doppelganger can copy a role and wake later with that copied role when the copied role has a later phase.
- Sentinel blocks supported card views and card movement.
- Bodyguard protects the player they vote for during the vote, not during the night.
- Prince cannot be eliminated by the village vote.
- Vote ties kill tied top targets when the top count is greater than one; if no player receives more than one vote, nobody dies.
- Hunter retaliation is included in final win resolution.
- The game now supports repeated night/day/vote cycles. If no team has won after the vote, the engine increments the day counter and starts the next night.
- Later-night queues skip first-night setup roles such as Robber, Troublemaker, Drunk, Doppelganger, Minion, Mason, Curator, and similar one-time information/swap roles.
- Later-night queues are based on living players' current cards, so a player who becomes a Werewolf joins the later hunt.
- Werewolves win when living Werewolves equal or outnumber living non-Werewolves. Villagers win when all living Werewolves are eliminated.

## Still Partial

- Vampire, Alien, Super Heroes, and several Bonus Roles still use generic wake acknowledgement unless a specific server action is implemented.
- Artifacts and Vampire Marks are not modeled as first-class objects yet.
- Doppelganger timing is practical but still hybrid: it copies on the first night and may wake with later eligible phases, while some official immediate-copy edge cases are simplified.
- Alpha Wolf has an internal extra Werewolf card, but the UI does not show a fourth center card.
- Minion and Squire are treated as wolf-team support for information, but advanced no-werewolf edge cases are not fully modeled.
- Some One Night roles are awkward in a multi-night format by nature. The engine treats them as first-night setup roles unless they clearly make sense as recurring roles.

## Product Guidance

For a public version, keep Nightfall's original name, role copy, card art, and UI treatment. The code can reimplement social deduction mechanics, but should not ship copied One Night card art, narration text, logos, or rulebook wording.
