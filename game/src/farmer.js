// The farmer: the hunter of the Thanksgiving table. He patrols the yard,
// gets suspicious when he glimpses feathers, chases when he is sure, and
// searches the last place he saw the bird when it vanishes into the hay.
//
// States:
//   CALM — patrols behind the turkey, keeping a lazy gap; the bird is safe.
//   SUSPICIOUS — "?" overhead; he has seen or heard something and closes in.
//   CHASE — "!" overhead; he runs faster than the turkey and will catch it
//     unless it sprints, jumps clear or hides. Catching costs a heart.
//   SEARCH — the turkey hid; he walks to the last seen spot and pokes
//     around it, then gives up and calms down if nothing turns up.
//
// Alertness (0–100) drives the transitions. It rises while the turkey is
// in plain sight and close, faster while the bird is slow or mid-jump, and
// falls while the bird hides or pulls far ahead. The meter is shown in
// the HUD so the player can read the danger before it bites.

import { clamp, lerp } from './random.js';

export const FARMER_STATES = ['CALM', 'SUSPICIOUS', 'CHASE', 'SEARCH'];

export class Farmer {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 150;
    this.state = 'CALM';
    this.alertness = 0;
    this.lastSeenX = 420;
    this.searchTimer = 0;
    this.searchDir = 1;
    this.walkCycle = 0;
    this.loseTimer = 0;
    this.spottedCount = 0;
    this.catchCooldown = 0;
    this.barkTimer = 0;
  }

  get w() { return 62; }
  get h() { return 108; }
  get centerX() { return this.x + this.w / 2; }

  // The mark drawn over his head: none, "?" or "!".
  get mark() {
    if (this.state === 'CHASE') return '!';
    if (this.state === 'SUSPICIOUS' || this.state === 'SEARCH') return '?';
    return '';
  }

  // True while the farmer can actually see the turkey.
  seesTurkey(turkey) {
    if (turkey.hidden) return false;
    return true;
  }

  // Move the farmer one step and update alertness. `baseSpeed` is the
  // stage's base pace; the turkey's real pace is derived from it (0
  // while hidden, base while running, base x 1.45 while sprinting).
  // The farmer's world pace is measured against the base, so sprinting
  // genuinely opens the gap and dawdling genuinely closes it.
  update(dt, turkey, baseSpeed, distance) {
    if (this.catchCooldown > 0) this.catchCooldown -= dt;
    if (this.barkTimer > 0) this.barkTimer -= dt;

    const turkeySpeed = turkey.hidden ? 0 : turkey.sprinting ? baseSpeed * 1.45 : baseSpeed;
    const gap = turkey.centerX - this.centerX;
    const visible = this.seesTurkey(turkey);

    if (visible) {
      this.lastSeenX = turkey.centerX;
      // Alertness only rises while the farmer is behind the bird and
      // can see it: close, slow or mid-jump is what gives the game away.
      if (gap > 0) {
        let rise = 0;
        if (gap < 480) rise += 7;
        if (gap < 280) rise += 5;
        if (!turkey.onGround) rise += 5;
        if (turkeySpeed < 300 && gap < 480) rise += 3;
        this.alertness = clamp(this.alertness + rise * dt, 0, 100);
      }
    } else {
      this.alertness = clamp(this.alertness - 26 * dt, 0, 100);
    }
    // Searching a cold trail calms him: a turkey far ahead is a
    // turkey lost, so alertness falls while he searches in vain.
    if (this.state === 'SEARCH' && gap > 200 && visible) {
      this.alertness = clamp(this.alertness - 10 * dt, 0, 100);
    }
    if (this.state === 'CALM') this.alertness = clamp(this.alertness - 3 * dt, 0, 100);

    // A hurt turkey stumbles clear: the farmer loses the trail.
    if (turkey.invulnerable > 0 && this.state === 'CHASE') {
      this.state = 'SEARCH';
      this.searchTimer = 2.0;
    }

    const prev = this.state;
    if (this.state !== 'CHASE' && this.alertness >= 85 && turkey.invulnerable <= 0) {
      this.state = 'CHASE';
      this.spottedCount++;
      this.barkTimer = 0.9;
      this.loseTimer = 0;
    } else if (this.state === 'CALM' && this.alertness >= 62) {
      this.state = 'SUSPICIOUS';
    } else if (this.state === 'SUSPICIOUS' && this.alertness < 40) {
      this.state = 'CALM';
    } else if (this.state === 'CHASE' && !visible) {
      this.state = 'SEARCH';
      this.searchTimer = 3.0;
    }
    if (this.state === 'CHASE') {
      // Outrun him: a wide gap held for a while breaks the chase.
      if (gap > 300) this.loseTimer += dt;
      else this.loseTimer = 0;
      if (this.loseTimer > 1.6) {
        this.state = 'SEARCH';
        this.searchTimer = 3.2;
        this.loseTimer = 0;
      }
    }
    if (this.state === 'SEARCH') {
      this.searchTimer -= dt;
      if (this.searchTimer <= 0 && this.alertness < 30) this.state = 'CALM';
    }
    if (prev !== this.state && this.state === 'CHASE') this.barkTimer = 0.9;

    // Movement: the farmer's WORLD pace per state, turned into a screen
    // velocity by subtracting the turkey's real pace. The turkey sits
    // at a fixed screen x while the world scrolls, so he only gains on
    // screen when he truly runs faster than the bird. CALM hovers
    // ~300 px behind, SUSPICIOUS closes slowly, CHASE closes at
    // 55 px/s against a plain run (a sprint outruns it), SEARCH walks
    // to the last seen spot on screen and pokes around it.
    let screenVx = 0;
    if (this.state === 'CALM') {
      const wantGap = 300;
      const error = gap - wantGap;
      screenVx = baseSpeed - 18 + clamp(error, -60, 60) * 0.9 - turkeySpeed;
    } else if (this.state === 'SUSPICIOUS') {
      screenVx = baseSpeed + 22 - turkeySpeed;
    } else if (this.state === 'CHASE') {
      screenVx = baseSpeed + 55 - turkeySpeed;
    } else if (this.state === 'SEARCH') {
      const toSpot = this.lastSeenX - this.centerX;
      if (Math.abs(toSpot) > 26) {
        screenVx = Math.sign(toSpot) * 130;
      } else {
        this.searchDir = this.searchTimer % 1.4 < 0.7 ? 1 : -1;
        screenVx = this.searchDir * 62;
      }
    }
    this.x += screenVx * dt;
    this.x = Math.max(30, this.x);
    // The farmer never runs past the turkey: he catches it or he
    // doesn't, he never overtakes it and jogs off the right edge.
    this.x = Math.min(this.x, turkey.x - 10);
    this.walkCycle += dt * (Math.abs(screenVx) / 24 + 2);
  }

  // The farmer catches the turkey when their boxes overlap and the
  // catch is not on cooldown. The game then spends a heart.
  catches(turkey) {
    if (this.catchCooldown > 0) return false;
    if (turkey.hidden || turkey.invulnerable > 0) return false;
    const overlap = this.centerX + 30 > turkey.x + 8 && this.x + 8 < turkey.x + turkey.w;
    const vertical = turkey.feetY > 560;
    return overlap && vertical;
  }

  // After a catch, the farmer steps back and loses the trail.
  afterCatch() {
    this.x = 130;
    this.state = 'CALM';
    this.alertness = 15;
    this.catchCooldown = 2.5;
    this.loseTimer = 0;
  }
}

export { clamp, lerp };
