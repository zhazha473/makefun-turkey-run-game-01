// Deterministic screenshot staging for Gobble Run. The maker opens the
// game with ?shot=<name>&seed=1 and the game builds one fixed scene,
// renders it once and sets window.__shotReady. No input, no clock and
// no random roll is involved after staging, so the same query always
// paints the same frame.
//
//   cover   — mid-run in the kitchen: the turkey mid-jump, the farmer
//             chasing with "!" over his head, the oven bursting, a
//             carving knife falling, a pumpkin rolling, corn and the
//             full HUD in one readable frame.
//   title   — the title screen.
//   kitchen — a run through stage 3: stove, cleaver, oven, corn, HUD.
//   end     — the ESCAPED end screen with score and run rating.

import { GROUND_Y, STAGE_LENGTH, TURKEY_SCREEN_X } from './world.js';

export function readShotQuery() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') ?? '1') || 1;
  return { shot, seed };
}

// Pick a game time that makes the oven at `ovenWorldX` burst its flame
// (its cycle is 2.6 s, bursting after 1.9 s).
export function flameBurstTime(ovenWorldX) {
  const phase = (ovenWorldX * 0.13) % 2.6;
  let t = 2.2 - phase;
  if (t < 0) t += 2.6;
  return t;
}

export function applyShot(game, name, seed) {
  game.seed = seed;
  if (name === 'title') {
    game.state = 'title';
    game.time = 1.0;
    game.bestDistance = 1240;
    return;
  }

  if (name === 'end') {
    game.state = 'end';
    game.endKind = 'escaped';
    game.distance = STAGE_LENGTH * 3;
    game.score = 4875;
    game.lives = 2;
    game.time = flameBurstTime(14300);
    game.turkey.cornCollected = 41;
    game.turkey.x = TURKEY_SCREEN_X;
    game.turkey.y = GROUND_Y - game.turkey.h;
    game.turkey.onGround = true;
    game.farmer.x = 150;
    game.farmer.state = 'CALM';
    game.farmer.alertness = 12;
    game.farmer.spottedCount = 1;
    game.bestDistance = STAGE_LENGTH * 3;
    game.runRating = 'SHADOW';
    return;
  }

  if (name === 'kitchen') {
    game.state = 'playing';
    game.distance = 11600;
    game.score = 2410;
    game.lives = 2;
    game.time = flameBurstTime(12200);
    game.turkey.cornCollected = 23;
    game.turkey.stamina = 80;
    game.turkey.x = TURKEY_SCREEN_X;
    game.turkey.y = GROUND_Y - game.turkey.h;
    game.turkey.onGround = true;
    game.turkey.runCycle = 1.2;
    game.farmer.x = 170;
    game.farmer.state = 'SUSPICIOUS';
    game.farmer.alertness = 71;
    game.farmer.walkCycle = 2.0;
    game.bestDistance = 11600;
    game.hazards.hazards = [
      { type: 'cleaver', x: 12100, y: GROUND_Y, t: 0.6, phase: 0, vy: 0, state: 'armed', stateT: 0, hit: false, snared: 0, anchorX: 12100, rope: 130, angle: 0.55, angleV: 0 },
    ];
    game.bannerT = 0;
    return;
  }

  // cover (default)
  game.state = 'playing';
  game.distance = 11550;
  game.score = 3120;
  game.lives = 3;
  game.time = flameBurstTime(12200);
  game.turkey.cornCollected = 19;
  game.turkey.stamina = 58;
  game.turkey.x = TURKEY_SCREEN_X;
  game.turkey.y = GROUND_Y - game.turkey.h - 150;
  game.turkey.vy = -260;
  game.turkey.onGround = false;
  game.turkey.runCycle = 0.8;
  game.farmer.x = 235;
  game.farmer.state = 'CHASE';
  game.farmer.alertness = 94;
  game.farmer.walkCycle = 3.1;
  game.farmer.barkTimer = 0.5;
  game.bestDistance = 11550;
  game.toasts = [{ text: 'SPOTTED!', color: '#ff6a4a', t: 1.6 }];
  game.hazards.hazards = [
    { type: 'knife', x: 11830, y: 170, t: 0.4, phase: 0, vy: 420, state: 'falling', stateT: 0, hit: false, snared: 0, anchorX: 11830, rope: 130, angle: 0, angleV: 0 },
    { type: 'pumpkin', x: 12350, y: GROUND_Y, t: 0.9, phase: 1.2, vy: 0, state: 'armed', stateT: 0, hit: false, snared: 0, anchorX: 12350, rope: 130, angle: 0, angleV: 0, rollSpeed: 280 },
  ];
  game.bannerT = 0;
}
