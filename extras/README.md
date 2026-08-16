# Extras

Standalone pieces that are **not wired into the game**. Nothing in `client/` or
`server/` imports from this directory, and nothing here runs unless you open it
yourself.

## `nightfall-reel.html`

A 46-second silent-film opening, drawn live on a `<canvas>` at 12fps. No video
file and no dependencies — the linework, the film grain, the gate weave and the
single hand-tinted red are all generated per frame.

Open it directly in a browser:

```bash
open extras/nightfall-reel.html      # macOS
xdg-open extras/nightfall-reel.html  # Linux
```

Beats, if you want to score it: the candles go out at 0:21, the shadow lands at
0:28, the chair goes over at 0:37, and the title resolves at 0:41.

### If you later want it as the real intro

It is one self-contained IIFE against a single `<canvas>`, so porting it means:

1. Wrap it as a component, canvas in a ref, start the loop in an effect, and
   cancel the `requestAnimationFrame` on unmount.
2. Gate it behind a `localStorage` flag the way the lobby quick guide is, so it
   plays once rather than on every visit.
3. Add a Skip control. Forty-six seconds is a long time to hold someone who has
   seen it before.
