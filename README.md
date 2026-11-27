# GOBBLE RUN: Escape the Thanksgiving Table — 3 stages, 6 hazards, 9 hiding spots, 72 corn

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/zhazha473/makefun-turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/zhazha473/makefun-turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

A complete, original turkey escape game for the make.fun
[turkey-run-game-01](https://make.fun/c/turkey-run-game-01)
bounty. It runs offline in a desktop browser from static files, played
with keyboard and mouse.

## How to play

You are the turkey, and Thanksgiving dinner is tonight. Outrun the
farmer through the farmyard, slip through the barn, and escape the
kitchen before the oven and the carving knife catch up with you.

- **Space / W / ↑ / click** — jump
- **↓ / S** — hide in a haystack, hay bale or pantry sack (breaks the
  farmer's line of sight)
- **Shift** — sprint (uses stamina)
- **P / Esc** — pause · **M** — mute · **R** — restart the run

The farmer patrols, gets suspicious ("?"), chases ("!") and searches
the last place he saw you. Six hazards stand between you and freedom:
falling carving knives, rolling pumpkins, snare traps, swinging
cleavers, oven flame bursts and hot stove burners. Grab corn for
points, stay unseen for the GHOST bonus (+500 per stage), and reach
1,500 m to escape. Three hearts — a hazard hit or a farmer catch
costs one.

## Play it

```sh
node serve.ts        # opens http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## Layout

- `game/index.html` + `game/styles.css` — page and canvas
- `game/src/main.js` — screens and the frame loop
- `game/src/world.js` — 3 stages, 9 hide spots, 72 corn, fixed hazards
- `game/src/turkey.js` — the turkey: run, jump, hide, stamina, corn
- `game/src/farmer.js` — the farmer AI: patrol, suspect, chase, search
- `game/src/hazards.js` — 6 hazard types: knife, pumpkin, snare, cleaver, flame, stove
- `game/src/render.js` — the farm, the barn, the kitchen, the turkey, the farmer
- `game/src/hud.js` — HUD, title screen, pause, caught / escaped screens
- `game/src/audio.js` — synthesized WebAudio sounds and tension music
- `game/src/input.js` — keyboard + mouse
- `game/src/shots.js` — deterministic screenshot staging
- `game/src/random.js` — seeded random numbers
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
