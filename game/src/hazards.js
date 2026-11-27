// The dangers of the Thanksgiving table: six hazard types, each with its
// own telegraph, timing and dodge. A hazard only hurts when its box
// touches the turkey's box while the bird is not invulnerable; every one
// of them warns first — a whistle, a glow, a glint — so a hit is the
// player's mistake, not the game's.
//
//   knife    — a carving knife drops from the sky onto a marked spot;
//              a shadow and a whistle warn a second before it lands.
//   pumpkin  — a pumpkin rolls in from the right along the ground; jump it.
//   snare    — a rope trap lying flat on the ground; jump it, or it snaps
//              shut and holds the bird for a second.
//   cleaver  — a butcher's cleaver swings from a beam on a rope, a
//              pendulum over a fixed point; pass under it at the right beat.
//   flame    — an oven door bursts open with a jet of fire on a timer;
//              the glow warns half a second before the jet.
//   stove    — a hot burner glowing on the kitchen floor; jump clean over.
//
// Procedural hazards (knife, pumpkin, snare) spawn ahead of the turkey
// from the stage's spawn table as distance grows. Fixed hazards (cleaver,
// flame, stove) live at the furniture the world defines and arm
// themselves when the turkey comes near.

import { GROUND_Y, stageAt, stageStart } from './world.js';
import { makeRng, roll, clamp } from './random.js';

export const HAZARD_NAMES = {
  knife: 'Carving Knife',
  pumpkin: 'Rolling Pumpkin',
  snare: 'Snare Trap',
  cleaver: 'Swinging Cleaver',
  flame: 'Oven Flame',
  stove: 'Hot Stove',
};

function makeHazard(type, x, extra = {}) {
  return {
    type,
    x,
    y: extra.y ?? GROUND_Y,
    t: 0,
    phase: extra.phase ?? 0,
    vy: extra.vy ?? 0,
    state: 'warn',
    stateT: 0,
    hit: false,
    snared: 0,
    anchorX: extra.anchorX ?? x,
    rope: extra.rope ?? 130,
    angle: extra.angle ?? -0.9,
    angleV: 0,
    ...extra,
  };
}

export class HazardManager {
  constructor(seed) {
    this.rng = makeRng(seed + 4242);
    this.hazards = [];
    this.nextSpawnAt = 900;
    this.spawned = 0;
  }

  reset(seed) {
    this.rng = makeRng(seed + 4242);
    this.hazards = [];
    this.nextSpawnAt = 900;
    this.spawned = 0;
  }

  // Fixed furniture hazards of the current stage, armed when near.
  // Their x is stage-relative in the world data; convert to world x.
  fixedHazards(distance) {
    const stage = stageAt(distance);
    const base = stageStart(stage.index);
    const out = [];
    for (const oven of stage.ovens) {
      out.push({ type: 'flame', x: base + oven.x, oven, state: 'armed' });
    }
    for (const stove of stage.stoves) {
      out.push({ type: 'stove', x: base + stove.x, w: stove.w, state: 'armed' });
    }
    for (const c of stage.cleavers) {
      out.push({ type: 'cleaver', x: base + c.x, rope: c.rope, state: 'armed' });
    }
    return out;
  }

  // Spawn procedural hazards ahead of the turkey as distance grows.
  spawnAhead(distance) {
    const stage = stageAt(distance);
    while (this.nextSpawnAt < distance + 1500) {
      const at = this.nextSpawnAt;
      const type = stage.spawnTypes[Math.floor(this.rng() * stage.spawnTypes.length)];
      const x = at + roll(this.rng, 0, 260);
      if (type === 'knife') {
        // A knife lands where the turkey will be when it falls: the
        // warning (0.9 s) plus the fall (~0.7 s) is ~520 px of travel,
        // so the shadow marks the bird's path and the player must jump
        // the stuck blade. A knife spawned far ahead would fall and be
        // gone before the turkey ever arrived.
        this.hazards.push(makeHazard('knife', distance + 520 + roll(this.rng, 0, 160), { y: -40, vy: 0, stateT: 1.2 }));
      } else if (type === 'pumpkin') {
        this.hazards.push(makeHazard('pumpkin', x, { rollSpeed: roll(this.rng, 160, 240) }));
      } else if (type === 'snare') {
        this.hazards.push(makeHazard('snare', x, { state: 'armed' }));
      } else if (type === 'cleaver') {
        this.hazards.push(makeHazard('cleaver', x, { rope: roll(this.rng, 110, 160), angle: -1.0, state: 'armed' }));
      } else if (type === 'flame') {
        this.hazards.push(makeHazard('flame', x, { state: 'armed' }));
      } else if (type === 'stove') {
        this.hazards.push(makeHazard('stove', x, { w: 170, state: 'armed' }));
      }
      this.spawned++;
      this.nextSpawnAt = at + roll(this.rng, 720, 1150);
    }
  }

  // Advance every hazard one step. screenX converts world x to screen x.
  update(dt, distance, screenX, turkey) {
    this.spawnAhead(distance);
    const keep = [];
    for (const hz of this.hazards) {
      hz.t += dt;
      const sx = screenX(hz.x);
      if (sx < -260 && hz.type !== 'knife') continue;
      if (sx > 2200) { keep.push(hz); continue; }
      if (hz.type === 'knife') {
        if (hz.state === 'warn') {
          hz.stateT -= dt;
          if (hz.stateT <= 0) hz.state = 'falling';
        } else if (hz.state === 'falling') {
          hz.vy += 2600 * dt;
          hz.y += hz.vy * dt;
          if (hz.y >= GROUND_Y - 8) {
            hz.y = GROUND_Y - 8;
            hz.state = 'stuck';
            hz.stateT = 1.4;
          }
        } else if (hz.state === 'stuck') {
          hz.stateT -= dt;
          if (hz.stateT <= 0) hz.state = 'gone';
        }
        if (hz.state !== 'gone') keep.push(hz);
      } else if (hz.type === 'pumpkin') {
        hz.x -= (hz.rollSpeed ?? 280) * dt;
        hz.phase += dt * 6;
        if (sx > -160) keep.push(hz);
      } else if (hz.type === 'snare') {
        if (hz.snared > 0) hz.snared -= dt;
        if (sx > -120) keep.push(hz);
      } else if (hz.type === 'cleaver') {
        const accel = -9.8 * Math.sin(hz.angle) / (hz.rope / 90);
        hz.angleV += accel * dt;
        hz.angleV *= 0.995;
        hz.angle += hz.angleV * dt;
        if (sx > -200) keep.push(hz);
      } else if (hz.type === 'flame' || hz.type === 'stove') {
        if (sx > -260) keep.push(hz);
      }
    }
    this.hazards = keep;
  }

  // Box of a hazard in screen space, for the renderer and collisions.
  box(hz, screenX) {
    const sx = screenX(hz.x);
    if (hz.type === 'knife') return { x: sx - 8, y: hz.y, w: 16, h: 92 };
    if (hz.type === 'pumpkin') return { x: sx - 26, y: GROUND_Y - 52, w: 52, h: 52 };
    if (hz.type === 'snare') return { x: sx - 34, y: GROUND_Y - 14, w: 68, h: 16 };
    if (hz.type === 'cleaver') {
      const bx = sx + Math.sin(hz.angle) * hz.rope;
      const by = GROUND_Y - 260 + Math.cos(hz.angle) * hz.rope;
      return { x: bx - 14, y: by - 10, w: 28, h: 74 };
    }
    if (hz.type === 'flame') return { x: sx - 58, y: GROUND_Y - 150, w: 116, h: 150 };
    if (hz.type === 'stove') return { x: sx - (hz.w ?? 170) / 2, y: GROUND_Y - 26, w: hz.w ?? 170, h: 26 };
    return { x: sx, y: GROUND_Y - 40, w: 40, h: 40 };
  }

  // Is this hazard dangerous right now (its telegraph has finished)?
  armed(hz, screenX) {
    if (hz.type === 'knife') return hz.state === 'falling' || hz.state === 'stuck';
    if (hz.type === 'flame') {
      const cycle = (hz.t % 2.6);
      return cycle > 1.9;
    }
    if (hz.type === 'snare') return hz.snared <= 0;
    return true;
  }

  // Check the turkey against every hazard. Returns the first hazard
  // that hits, or null. A snare hit also roots the bird briefly.
  checkHits(turkey, screenX) {
    if (turkey.invulnerable > 0 || turkey.hidden) return null;
    const tb = turkey.box();
    for (const hz of this.hazards) {
      if (!this.armed(hz, screenX)) continue;
      const hb = this.box(hz, screenX);
      const overlap = tb.x < hb.x + hb.w && tb.x + tb.w > hb.x && tb.y < hb.y + hb.h && tb.y + tb.h > hb.y;
      if (overlap) {
        if (hz.type === 'snare') hz.snared = 1.1;
        return hz;
      }
    }
    return null;
  }

  // Fixed furniture hazards are not in this.hazards; check them here.
  // `time` is the game's own clock (seconds), so staging a screenshot
  // with a fixed time always shows the same flame and cleaver beat.
  checkFixedHits(turkey, distance, screenX, time) {
    if (turkey.invulnerable > 0 || turkey.hidden) return null;
    const tb = turkey.box();
    for (const fx of this.fixedHazards(distance)) {
      if (fx.type === 'flame') {
        const cycle = ((time + fx.x * 0.13) % 2.6);
        if (cycle <= 1.9) continue;
        const sx = screenX(fx.x);
        const hb = { x: sx - 58, y: GROUND_Y - 150, w: 116, h: 150 };
        if (tb.x < hb.x + hb.w && tb.x + tb.w > hb.x && tb.y < hb.y + hb.h && tb.y + tb.h > hb.y) return fx;
      } else if (fx.type === 'stove') {
        const sx = screenX(fx.x);
        const hb = { x: sx - fx.w / 2, y: GROUND_Y - 26, w: fx.w, h: 26 };
        if (tb.x < hb.x + hb.w && tb.x + tb.w > hb.x && tb.y < hb.y + hb.h && tb.y + tb.h > hb.y) return fx;
      } else if (fx.type === 'cleaver') {
        const sx = screenX(fx.x);
        const angle = Math.sin((time + fx.x * 0.07) * 1.9) * 0.85;
        const bx = sx + Math.sin(angle) * fx.rope;
        const by = GROUND_Y - 260 + Math.cos(angle) * fx.rope;
        const hb = { x: bx - 14, y: by - 10, w: 28, h: 74 };
        if (tb.x < hb.x + hb.w && tb.x + tb.w > hb.x && tb.y < hb.y + hb.h && tb.y + tb.h > hb.y) return fx;
      }
    }
    return null;
  }
}

export { clamp };
