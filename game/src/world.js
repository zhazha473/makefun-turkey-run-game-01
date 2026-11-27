// The farm, the barn and the kitchen: stage definitions, hide spots, corn
// layout and the fixed hazards of Gobble Run. Everything here is data, so
// the renderer and the spawner can read the same truth about the world.
//
// Distances are in pixels of world travel; the turkey runs right and the
// world scrolls left. One stage is 5,000 px (500 m). The turkey escapes
// after 15,000 px (1,500 m). Corn is laid out by a seeded generator so the
// same seed always builds the same farm: 8 clusters of 3 cobs per stage,
// 24 cobs a stage, 72 cobs in a full run.
//
// Hide spots (haystacks, hay bales, pantry sacks): 3 in the farmyard,
// 4 in the barn, 2 in the kitchen — 9 in all. Standing next to one and
// holding Down hides the turkey and breaks the farmer's line of sight.
//
// Hazard types in the game (6): falling carving knife, rolling pumpkin,
// snare trap, swinging cleaver, oven flame burst, hot stove burner.
// Stage 1 allows knife / pumpkin / snare, stage 2 adds the cleaver,
// stage 3 adds oven flames and stove burners.

import { makeRng, roll, rollInt } from './random.js';

export const GROUND_Y = 620;
export const STAGE_LENGTH = 5000;
export const STAGE_COUNT = 3;
export const ESCAPE_DISTANCE = STAGE_LENGTH * STAGE_COUNT;
export const PX_PER_METER = 10;
export const TURKEY_SCREEN_X = 420;

export const HAZARD_TYPES = ['knife', 'pumpkin', 'snare', 'cleaver', 'flame', 'stove'];

// One entry per stage: name, banner, palette, base run speed, which
// procedural hazards may spawn, and the fixed furniture of the stage.
export const STAGES = [
  {
    index: 0,
    name: 'FARMYARD',
    subtitle: 'Stage 1 — the yard at dawn',
    banner: 'STAGE 1 · FARMYARD',
    sky: ['#f7c873', '#f2a65a', '#e88f4a'],
    ground: '#8a5a2b',
    groundTop: '#b5773a',
    grass: '#c98a3d',
    accent: '#d97b2f',
    baseSpeed: 265,
    spawnTypes: ['pumpkin', 'snare', 'knife'],
    fences: [
      { x: 1800, w: 46, h: 74 },
      { x: 3500, w: 46, h: 74 },
    ],
    hideSpots: [
      { x: 1200, kind: 'haystack' },
      { x: 2600, kind: 'haystack' },
      { x: 4300, kind: 'haystack' },
    ],
    ovens: [],
    stoves: [],
    cleavers: [],
    trees: [700, 2100, 3100, 4600],
    clouds: [300, 1500, 2900, 4100],
  },
  {
    index: 1,
    name: 'BARN',
    subtitle: 'Stage 2 — the dark barn',
    banner: 'STAGE 2 · THE BARN',
    sky: ['#7a4a26', '#5d3418', '#472512'],
    ground: '#6b4423',
    groundTop: '#8a5a2e',
    grass: '#a06a35',
    accent: '#e0a83c',
    baseSpeed: 305,
    spawnTypes: ['snare', 'knife', 'cleaver', 'pumpkin'],
    fences: [
      { x: 1500, w: 60, h: 62 },
      { x: 3100, w: 60, h: 62 },
    ],
    hideSpots: [
      { x: 800, kind: 'haybale' },
      { x: 2100, kind: 'haybale' },
      { x: 3300, kind: 'haybale' },
      { x: 4500, kind: 'haybale' },
    ],
    ovens: [],
    stoves: [],
    cleavers: [
      { x: 2500, rope: 150 },
      { x: 4000, rope: 120 },
    ],
    trees: [],
    clouds: [],
  },
  {
    index: 2,
    name: 'KITCHEN',
    subtitle: 'Stage 3 — the Thanksgiving kitchen',
    banner: 'STAGE 3 · THE KITCHEN',
    sky: ['#c96a3a', '#a34a24', '#7e3517'],
    ground: '#7c4a26',
    groundTop: '#9c6238',
    grass: '#b57a42',
    accent: '#f2b13c',
    baseSpeed: 345,
    spawnTypes: ['knife', 'cleaver', 'flame', 'stove'],
    fences: [
      { x: 1600, w: 70, h: 58 },
      { x: 3400, w: 70, h: 58 },
    ],
    hideSpots: [
      { x: 1500, kind: 'sacks' },
      { x: 3600, kind: 'sacks' },
    ],
    ovens: [
      { x: 2200, w: 150, h: 190 },
      { x: 4300, w: 150, h: 190 },
    ],
    stoves: [
      { x: 1200, w: 170 },
      { x: 3100, w: 170 },
    ],
    cleavers: [
      { x: 2800, rope: 130 },
    ],
    trees: [],
    clouds: [],
  },
];

// Stage for a world distance (px). Returns the stage object.
export function stageAt(distance) {
  const index = Math.min(STAGE_COUNT - 1, Math.floor(distance / STAGE_LENGTH));
  return STAGES[index];
}

// World x of the start of a stage.
export function stageStart(index) {
  return index * STAGE_LENGTH;
}

// Lay out the corn of one stage from a seed: 8 clusters of 3 cobs,
// some on the ground, some arced over fences so jumping pays off.
// Returns [{x, y, taken}] with x in world px and y in screen px.
export function buildStageCorn(stageIndex, seed) {
  const rng = makeRng(seed + stageIndex * 1013);
  const start = stageStart(stageIndex);
  const corn = [];
  for (let cluster = 0; cluster < 8; cluster++) {
    const baseX = start + 350 + cluster * 560 + roll(rng, -80, 80);
    const high = rng() < 0.38;
    for (let i = 0; i < 3; i++) {
      const x = baseX + i * 44;
      const y = high ? GROUND_Y - 150 - Math.sin((i / 2) * Math.PI) * 46 : GROUND_Y - 34;
      corn.push({ x, y, taken: false });
    }
  }
  return corn;
}

// Lay out all 72 cobs of a run (24 per stage).
export function buildRunCorn(seed) {
  const all = [];
  for (let i = 0; i < STAGE_COUNT; i++) all.push(...buildStageCorn(i, seed));
  return all;
}

// Count the hide spots across the whole run (9).
export function countHideSpots() {
  return STAGES.reduce((n, s) => n + s.hideSpots.length, 0);
}

// A few drifting autumn leaves for the farmyard, seeded per run.
export function buildLeaves(seed) {
  const rng = makeRng(seed + 77);
  const leaves = [];
  for (let i = 0; i < 26; i++) {
    leaves.push({
      x: roll(rng, 0, 1280),
      y: roll(rng, 40, 420),
      size: roll(rng, 7, 15),
      speed: roll(rng, 18, 55),
      sway: roll(rng, 0.6, 1.8),
      phase: roll(rng, 0, Math.PI * 2),
      color: ['#d97b2f', '#e8a83c', '#b84a2a', '#c98a3d'][rollInt(rng, 0, 3)],
    });
  }
  return leaves;
}
