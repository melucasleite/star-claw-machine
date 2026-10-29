# START CLAW

A claw machine where the claw's grip isn't left to a hidden payout timer. **You earn it.**

The gantry carriage, the box that rides the rails and holds the claw motor, has a tall, narrow screen on its front face. When you press **REEL** to drop the claw, a fishing minigame in the style of Stardew Valley starts on that screen. It runs while the claw descends. How well you play decides how hard the claw grips.

![Concept render](designs/concept-render.png)

## Repo layout

| Path                         | What                                                                  |
| ---------------------------- | --------------------------------------------------------------------- |
| `docs/concept.md`            | Product concept, player flow, and why the screen sits on the carriage |
| `docs/minigame.md`           | Minigame rules, tuning parameters, and prize tiers                    |
| `docs/hardware.md`           | Carriage box layout, electronics, and draft BOM                       |
| `designs/concept-render.png` | AI concept render (GPT Image)                                         |
| `designs/carriage-box.svg`   | Dimensioned front and side views of the carriage box                  |
| `prototype/index.html`       | Isometric 3D claw machine with physics grab and the teddy reel game   |
| `prototype/minigame-2d.html` | First 2D-only sketch of the reel minigame                             |

## Try the prototype

Open `prototype/index.html` in a browser. It loads three.js and cannon-es from a CDN, so you need to be online.

- **Arrow keys** move the claw. There's no landing guide, so judge it by eye.
- **Space** drops the claw. It grabs whatever the physics lets it grab.
- **Hold Space** during the reel game to lift the green bar. Keep the plushie in the bar to keep the grip strong.
- **R** restocks the machine and starts a new run (it asks first).

On a phone: **drag** to move the claw, **tap** to drop, and **hold your finger down** to reel. The RESTOCK button does the same as R.

### Scoring

The machine is stocked with 15 plushies (bears, cats, dogs, bunnies and axolotls). The animal sets the shape; the colour sets the reel difficulty and the points:

| Colour | Points | Stocked |
| ------ | ------ | ------- |
| Mint   | 10     | 5       |
| Sky    | 25     | 4       |
| Lilac  | 50     | 3       |
| Peach  | 100    | 2       |
| Cherry | 250    | 1       |

A perfect reel (never leaving the bar) is worth x1.5, and back-to-back catches build a streak up to x3. You have 5 hearts: a grab that comes up empty costs half a heart, and losing the reel or dropping the plushie costs a whole one. Clearing the machine pays 500 plus 100 per heart left. The top 5 scores are kept in `localStorage`.

## Formatting

```bash
yarn format
```
