# STAR CLAW

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
- **M** toggles the music and **S** the sound effects (or the note and speaker buttons in the corner).
- **Q** (or the QUIT & SAVE button, top left) cashes out: the run ends and your score goes to the high score list (it asks first).

On a phone: **drag** to move the claw, **tap** to drop, and **hold your finger down** to reel.

### Scoring

The machine is stocked with 15 plushies, dealt from ten animals (bears, cats, dogs, bunnies, axolotls, frogs, penguins, pigs, ducks and foxes). The animal sets the shape; the colour sets the reel difficulty and the points:

| Colour | Points | Stocked |
| ------ | ------ | ------- |
| Mint   | 10     | 5       |
| Sky    | 25     | 4       |
| Lilac  | 50     | 3       |
| Peach  | 100    | 2       |
| Cherry | 250    | 1       |

A perfect reel (never leaving the bar) is worth x1.5, and back-to-back catches build a streak up to x3. You have 5 hearts: a grab that comes up empty or a plushie dropped on the way to the chute costs half a heart, and losing the reel costs a whole one. Every successful grab heals half a heart, up to the full 5. Cashing out with QUIT & SAVE pays 25 points per half heart you have left. Clearing the machine pays 500 plus 100 per heart left. Your top 5 scores are kept in `localStorage`, next to a world top 10 stored in Supabase (the `star_claw_scores` table in the `lucas-crafts` project; anyone can read it and add a score, nobody can edit or delete). Only names you type go to the world board.

Every plushie you win flies into the prize bag under the score, and the end screen shows the haul. Each colour and animal pair you have ever won counts toward your collection (50 in all), and a first-time catch is marked NEW!

## Formatting

```bash
yarn format
```

### Look and sound

The plushies are knitted: one procedural stitch tile (a colour map plus a bump map) is wrapped around every part with UVs scaled to the part's size, so the stitches stay the same size on a big belly and a small ear. Eyes are smooth, shiny buttons.

All audio is synthesised with Web Audio, so there are no sound files: a looping chiptune (8 bars of tune, 8 of groove), a motor hum that follows the claw, clacks and whirrs for the claw, pings, buzzes and a ratchet for the reel game, and jingles for prizes, hearts, high scores and clearing the machine. Browsers only start audio after a tap or key press, so it wakes up on the first one; on iPhone it is set to play even with the silent switch on.
