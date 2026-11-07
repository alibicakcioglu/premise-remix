# The Guide

**Premise 01 Agency × Premise 02 Reciprocity** · NMED 3203 premise remix

You are lost in a clearing at night. A fox offers to show you the way out. It knows which gate is the exit, but it also has a gate of its own. You always choose the gate (Agency). The fox reads every move you make as a reply and changes how it guides you in the next room (Reciprocity).

**Live link:** https://alibicakcioglu.github.io/premise-remix/

## How to play

| Action | Pointer / touch | Keyboard |
|---|---|---|
| Walk | click on the ground | arrows / WASD |
| Go to a gate | click a gate | `1`–`6` |
| Ask “are you sure?” | click the fox | `Q` |
| Inspect a gate | stand still in front of it | stand still in front of it |
| Choose | walk through a gate | walk through a gate |
| Design parameters (with Turkish notes) | CODE tab | `C` |

Get through 5 gates before your lantern goes out (3 wrong gates). In the CODE tab, `doors` sets how many gates each room has (2–6, from the next game; symbols stay on the same gates for the whole game) and `toEscape` how many you must pass. `foxGate` picks the fox’s own gate: `random` (default, a new symbol every game) or a fixed symbol (useful for a predictable demo).

## Where the premises live in the code (`script.js`)

- **Agency:** `ask()`, the inspection block in `update()`, and `choose()`. The player can follow, question, investigate, or defy; the gate is always the player's choice.
- **Reciprocity:** `choose()` reads the player's move as a reply and sets the fox's next `mood` (confident / insistent / hurt / nervous). `newRoom()` turns that mood into a lie probability (`DESIGN.lie…`). `ask()` and `reactToInspect()` make the fox answer within a room.
- Body language: `foxSpot()` and `animateHead()`, scaled by `DESIGN.tell`.
- All numbers are in `design` / `knobs` at the top of `script.js` and can be changed live in the **CODE** tab. The fox's lines are in `LINES`.

## Credits

- Built on **IMA Lab experiment 02 · Eye Field** by Mert Seven (NMED 3203): `engine.js`, `shell.js`, `runner.js`, `style.css`, the Owl Forest place and the Fox and Traveler characters. https://mertseven.com/ima/lab/
- three.js (MIT) and fonts (OFL) as listed in `licenses/`.
- Changes for this project: new `script.js` (game rules, gates, fox behaviour), `index.html` title, one line in `shell.js` (custom subtitle).

## Readings

- Wardrip-Fruin, N., Mateas, M., Dow, S. & Sali, S. (2009). Agency Reconsidered. *DiGRA 2009*.
- Dubberly, H., Haque, U. & Pangaro, P. (2009). What is interaction? Are there different types? *interactions*, 16(1).

## AI note

<!-- Edit in your own words. -->
- Claude (Anthropic) was used to narrow the idea and write `script.js`. ChatGPT was used in an earlier brainstorming stage.
- One thing I rejected or changed: _[write your own example]_
