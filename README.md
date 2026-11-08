# The Guide

**Premise 01 Agency × Premise 02 Reciprocity** · NMED 3203 premise remix

Night in the forest. A wolf offers to lead you, a lamb, out. It knows which gate is the exit, but it also has a gate of its own (🐺) and wants you to open it. You always choose the gate (Agency). The wolf reads every move you make as a reply and changes how it guides you in the next room (Reciprocity).

**Live link:** https://alibicakcioglu.github.io/premise-remix/

## How to play

| Action | Pointer / touch | Keyboard |
|---|---|---|
| Walk | click on the ground | arrows / WASD |
| Go to a gate | click a gate | `1`–`6` |
| Listen at a gate | stand still in front of it | stand still in front of it |
| Choose | walk through a gate | walk through a gate |
| Design parameters (with Turkish notes) | CODE tab | `C` |
| Day / night | DAY / NIGHT button | – |

Get through 5 gates before your lantern goes out (4 wrong gates). The WOLF LOG on the right records every room: the wolf's mood, what it said, the real exit, and whether you were right.

## The rules

- The wolf only lies when its own gate (🐺) is **not** the exit, and when it lies it always points at its own gate. If it points at any other gate, it is telling the truth.
- Its mood decides how often it lies:
  - **calm** (start, or after you doubted the truth) → `lieCalm`
  - **confident** (after you followed it) → `lieConfident`: trust it and it uses you
  - **ashamed** (after you caught a lie) → `lieAshamed`, 0 by default: catch it and it doesn't dare to lie
- Listening at a gate (stand still in front of it, once per room) reveals “a breeze…” (exit) or “silence.”; a lying wolf steps in front of the real exit.

## Where the premises live in the code (`script.js`)

- **Agency:** the inspection block in `update()` and `choose()`. The player can follow, listen at a gate, or defy; the gate is always the player's choice.
- **Reciprocity:** `choose()` reads the player's move as a reply and sets the wolf's next `mood`. `newRoom()` turns that mood into a lie probability. `reactToInspect()` makes the wolf answer within a room.
- **Feedback for learning:** `verdict()` and the WOLF LOG (`logRoom()`, `renderLog()`).
- Body language: `wolfSpot()` and `animateHead()`, scaled by `DESIGN.tell`.
- All numbers are in `design` / `knobs` at the top of `script.js` and can be changed live in the **CODE** tab. The wolf's lines are in `LINES`.

## Credits

- Built on **IMA Lab experiment 02 · Eye Field** by Mert Seven (NMED 3203): `engine.js`, `shell.js`, `runner.js`, `style.css`, the place and the character system. https://mertseven.com/ima/lab/
- three.js (MIT) and fonts (OFL) as listed in `licenses/`.
- Changes for this project: new `script.js` (game rules, gates, forest, wolf and lamb recipes built from the engine's parts, palette tweak), `index.html` (title, log card, no NOTES tab), small edits in `shell.js` (custom subtitle, Turkish knob notes), `runner.js` (navy night background) and `style.css` (night theme, log, code notes).

## Readings

- Wardrip-Fruin, N., Mateas, M., Dow, S. & Sali, S. (2009). Agency Reconsidered. *DiGRA 2009*.
- Dubberly, H., Haque, U. & Pangaro, P. (2009). What is interaction? Are there different types? *interactions*, 16(1).

## AI note

<!-- Edit in your own words. -->
- Claude (Anthropic) was used to narrow the idea and write `script.js`. ChatGPT was used in an earlier brainstorming stage.
- One thing I rejected or changed: _[write your own example]_
