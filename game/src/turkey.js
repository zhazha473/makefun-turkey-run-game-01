// The turkey: a runaway Thanksgiving bird. It runs right on its own; the
// player jumps, hides and sprints. Physics are simple and forgiving on
// purpose — a narrow escape should feel fair, not random.
//
// - run: auto-run at the stage base speed, sprint (Shift) multiplies it
//   by 1.45 while stamina lasts; stamina refills when not sprinting.
// - jump: Space / W / Up / click. A short hop while running, higher from
//   a standstill in a hide spot is not possible — hiding roots the bird.
// - hide: hold Down / S beside a haystack, hay bale or pantry sack. The
//   turkey ducks into it, the farmer loses sight, and the run pauses
//   (distance stops growing) while the bird waits out the search.
// - corn: cobs are collected on touch, +25 score each, with a little pop.
// - hurt: a hazard hit or a farmer catch costs one heart, knocks the bird
//   forward and grants 2 seconds of invulnerability (blinking).

import { GROUND_Y, TURKEY_SCREEN_X } from './world.js';
import { clamp } from './random.js';

export const TURKEY_W = 56;
export const TURKEY_H = 64;
export const GRAVITY = 2300;
export const JUMP_VELOCITY = -900;
export const SPRINT_MULTIPLIER = 1.45;
export const MAX_STAMINA = 100;

export class Turkey {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = TURKEY_SCREEN_X;
    this.y = GROUND_Y - TURKEY_H;
    this.vy = 0;
    this.onGround = true;
    this.stamina = MAX_STAMINA;
    this.sprinting = false;
    this.hidden = false;
    this.hideSpot = null;
    this.invulnerable = 0;
    this.hurtFlash = 0;
    this.runCycle = 0;
    this.facing = 1;
    this.cornCollected = 0;
    this.jumps = 0;
  }

  get w() { return TURKEY_W; }
  get h() { return TURKEY_H; }
  get centerX() { return this.x + this.w / 2; }
  get feetY() { return this.y + this.h; }

  // Current forward speed in px/s for the given base speed.
  speed(baseSpeed, wantSprint) {
    this.sprinting = wantSprint && this.stamina > 1 && !this.hidden;
    if (this.sprinting) return baseSpeed * SPRINT_MULTIPLIER;
    return baseSpeed;
  }

  jump() {
    if (this.hidden) return false;
    if (!this.onGround) return false;
    this.vy = JUMP_VELOCITY;
    this.onGround = false;
    this.jumps++;
    return true;
  }

  // Try to hide in a spot the world offers; returns the spot or null.
  tryHide(spots, worldToScreen) {
    if (!this.onGround) return null;
    for (const spot of spots) {
      const sx = worldToScreen(spot.x);
      if (Math.abs(sx - this.centerX) < 95) {
        this.hidden = true;
        this.hideSpot = spot;
        this.x = sx - this.w / 2;
        return spot;
      }
    }
    return null;
  }

  leaveHide() {
    this.hidden = false;
    this.hideSpot = null;
  }

  hurt() {
    if (this.invulnerable > 0) return false;
    this.invulnerable = 2.0;
    this.hurtFlash = 0.55;
    return true;
  }

  update(dt, baseSpeed, wantSprint) {
    if (this.invulnerable > 0) this.invulnerable -= dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (this.hidden) {
      this.stamina = Math.min(MAX_STAMINA, this.stamina + 26 * dt);
      return 0;
    }
    const speed = this.speed(baseSpeed, wantSprint);
    if (this.sprinting) this.stamina = Math.max(0, this.stamina - 34 * dt);
    else this.stamina = Math.min(MAX_STAMINA, this.stamina + 15 * dt);
    if (!this.onGround) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.feetY >= GROUND_Y) {
        this.y = GROUND_Y - this.h;
        this.vy = 0;
        this.onGround = true;
      }
    }
    this.runCycle += dt * (this.onGround ? speed / 26 : 4);
    return speed;
  }

  // Axis-aligned box used by hazard and farmer collision checks.
  box() {
    const shrink = this.hidden ? 0.35 : 0.12;
    return {
      x: this.x + this.w * shrink,
      y: this.y + this.h * 0.1,
      w: this.w * (1 - shrink * 2),
      h: this.h * 0.85,
    };
  }
}

// A corn cob: golden kernels, a green husk, worth 25 points.
export function collectCorn(turkey, corn, worldToScreen) {
  let gained = 0;
  for (const cob of corn) {
    if (cob.taken) continue;
    const sx = worldToScreen(cob.x);
    if (sx < -60 || sx > 1340) continue;
    const dx = sx - turkey.centerX;
    const dy = cob.y - (turkey.y + turkey.h * 0.45);
    if (dx * dx + dy * dy < 46 * 46) {
      cob.taken = true;
      turkey.cornCollected++;
      gained += 25;
    }
  }
  return gained;
}

export { clamp };
