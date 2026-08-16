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

## Liveness

Every point where the game waits on one person is now bounded. Each of these
could previously freeze a room permanently:

- A reveal result holds the night queue until the player clicks Continue. The
  wait is capped, a departing player's hold is released, and the host can force
  dawn.
- The Hunter's last shot halts the game until they choose. Bots choose for
  themselves; humans get thirty seconds before the shot goes wide.
- A verdict stays latched from the moment it commits until the next phase
  starts, so repeated Force Verdict presses cannot cancel the transition.
- A disconnect holds the player's seat for two minutes rather than ending the
  game, and host duty transfers immediately.

`server/logic_check.js` covers all of these. Engine fuzzing (bot games against a
virtual clock) runs hundreds of full games start to finish with none stuck.

## Ghosts

Lingering is rolled per death at 10%, not conferred on everyone who dies. A
ghost may leave the village one letter per day. Ghost is not a dealable card.

## Wolf Team

The pack chooses its victim before the Alpha Wolf wakes, so a conversion can
land on the player already marked to die. A bite on anyone already on the wolf
team fizzles, which makes converting the marked victim a real play: the pack
gains a member and loses the kill. The Alpha is refused outright when targeting
its own team.

## Still Partial

- Alien, Super Heroes, and several Bonus Roles still use generic wake acknowledgement unless a specific server action is implemented.
- Artifacts and Vampire Marks are not modeled as first-class objects yet.
- Doppelganger timing is practical but still hybrid: it copies on the first night and may wake with later eligible phases, while some official immediate-copy edge cases are simplified.
- Alpha Wolf has an internal extra Werewolf card, but the UI does not show a fourth center card.
- Mason, Insomniac, Mystic Wolf, Paranormal Investigator and Curator have working logic but no card art, so they render without an image.
- Minion and Squire are treated as wolf-team support for information, but advanced no-werewolf edge cases are not fully modeled.
- Some One Night roles are awkward in a multi-night format by nature. The engine treats them as first-night setup roles unless they clearly make sense as recurring roles.

## Product Guidance

For a public version, keep Nightfall's original name, role copy, card art, and UI treatment. The code can reimplement social deduction mechanics, but should not ship copied One Night card art, narration text, logos, or rulebook wording.
