// Gobble Run: bootstrap and the game loop. The Game holds the whole run
// — the turkey, the farmer, the hazards, the score, the stage and the
// screens — and steps it in fixed slices of time. States: title,
// playing, paused, end (caught or escaped). A run is won by reaching
// 1,500 m through the farmyard, the barn and the kitchen; it is lost
// when the turkey's three hearts run out.
//
// Scoring: 1 point per metre travelled, 25 per corn cob, and a 500
// point GHOST bonus for every stage finished without the farmer ever
// reaching CHASE. The run rating is GHOST (never spotted), SHADOW
// (spotted once) or SEEN (spotted twice or more).

import { Turkey, collectCorn } from './turkey.js';
import { Farmer } from './farmer.js';
import { HazardManager, HAZARD_NAMES } from './hazards.js';
import { drawScene, drawTurkey } from './render.js';
import { drawHUD, drawTitle, drawPause, drawEnd } from './hud.js';
import { SoundEngine } from './audio.js';
import { Input } from './input.js';
import { applyShot, readShotQuery } from './shots.js';
import {
  GROUND_Y,
  STAGE_LENGTH,
  STAGE_COUNT,
  ESCAPE_DISTANCE,
  PX_PER_METER,
  TURKEY_SCREEN_X,
  buildRunCorn,
  buildLeaves,
  countHideSpots,
  stageAt,
  stageStart,
} from './world.js';
import { clamp } from './random.js';

export const HIDE_SPOT_COUNT = countHideSpots();
export const CORN_TOTAL = 72;
export const HAZARD_TYPE_COUNT = 6;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

window.__errors = [];
window.__shotReady = false;
window.addEventListener('error', (event) => {
  window.__errors.push(String(event.message || event.error || 'error'));
});

export class Game {
  constructor(seed) {
    this.seed = seed;
    this.turkey = new Turkey();
    this.farmer = new Farmer();
    this.hazards = new HazardManager(seed);
    this.audio = new SoundEngine();
    this.input = new Input(canvas);
    this.corn = buildRunCorn(seed);
    this.leaves = buildLeaves(seed);
    this.state = 'title';
    this.distance = 0;
    this.score = 0;
    this.lives = 3;
    this.time = 0;
    this.bestDistance = 0;
    this.muted = false;
    this.shake = 0;
    this.bannerT = 0;
    this.bannerStage = -1;
    this.toasts = [];
    this.endKind = 'caught';
    this.runRating = 'SEEN';
    this.stageGhost = [true, true, true];
    this.maxAlertThisStage = 0;
    this.stageIndex = 0;
    this.stepTimer = 0;
    this.startButton = null;
    this.restartButton = null;
    this.shotMode = false;
    this.frames = 0;
  }

  screenX(worldX) {
    return TURKEY_SCREEN_X + (worldX - this.distance);
  }

  toast(text, color) {
    this.toasts.push({ text, color, t: 1.8 });
  }

  startRun() {
    this.turkey.reset();
    this.farmer.reset();
    this.hazards.reset(this.seed);
    this.corn = buildRunCorn(this.seed);
    this.distance = 0;
    this.score = 0;
    this.lives = 3;
    this.time = 0;
    this.shake = 0;
    this.bannerT = 0;
    this.bannerStage = -1;
    this.toasts = [];
    this.stageGhost = [true, true, true];
    this.maxAlertThisStage = 0;
    this.stageIndex = 0;
    this.state = 'playing';
    this.audio.ensure();
    this.audio.gobble();
    this.showBanner(0);
  }

  showBanner(stageIndex) {
    this.bannerStage = stageIndex;
    this.bannerT = 2.4;
  }

  loseHeart(cause) {
    if (!this.turkey.hurt()) return;
    this.lives--;
    this.shake = 0.9;
    this.audio.thud();
    if (cause === 'farmer') {
      this.audio.caught();
      this.toast('CAUGHT BY THE FARMER!', '#ff6a4a');
      this.farmer.afterCatch();
      // Back to the start of the current stage, one heart lighter.
      this.distance = stageStart(this.stageIndex);
      this.hazards.reset(this.seed);
      this.hazards.nextSpawnAt = this.distance + 700;
    } else {
      this.toast(`OUCH! ${HAZARD_NAMES[cause] || cause}`, '#ff6a4a');
      if (cause === 'snare') this.audio.snareSnap();
      else if (cause === 'flame') this.audio.hiss();
      else this.audio.whoosh();
    }
    if (this.lives <= 0) this.endRun('caught');
  }

  endRun(kind) {
    this.endKind = kind;
    this.state = 'end';
    this.bestDistance = Math.max(this.bestDistance, this.distance);
    this.runRating =
      this.farmer.spottedCount === 0 ? 'GHOST' : this.farmer.spottedCount === 1 ? 'SHADOW' : 'SEEN';
    if (kind === 'escaped') this.audio.win();
    else this.audio.caught();
  }

  update(dt) {
    this.time += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 1.6);
    if (this.bannerT > 0) this.bannerT -= dt;
    for (const toast of this.toasts) toast.t -= dt;
    this.toasts = this.toasts.filter((t) => t.t > 0);

    if (this.input.mutePressed) {
      this.muted = !this.muted;
      this.audio.setMuted(this.muted);
    }

    if (this.state === 'title') {
      this.audio.ensure();
      if (this.input.startPressed || this.input.clickedButton(this.startButton)) {
        this.audio.click();
        this.startRun();
      }
      return;
    }

    if (this.state === 'end') {
      if (this.input.restartPressed || this.input.clickedButton(this.restartButton)) {
        this.audio.click();
        this.startRun();
      }
      return;
    }

    if (this.state === 'paused') {
      if (this.input.pausePressed) {
        this.state = 'playing';
        this.audio.click();
      }
      if (this.input.restartPressed) this.startRun();
      return;
    }

    // --- playing ---
    if (this.input.pausePressed) {
      this.state = 'paused';
      this.audio.click();
      return;
    }
    if (this.input.restartPressed) {
      this.startRun();
      return;
    }

    const stage = stageAt(this.distance);
    if (stage.index !== this.stageIndex) {
      const finished = this.stageIndex;
      this.stageIndex = stage.index;
      if (this.stageGhost[finished]) {
        this.score += 500;
        this.toast('GHOST BONUS +500 — never spotted!', '#b8e986');
        this.audio.stageClear();
      }
      this.maxAlertThisStage = 0;
      this.showBanner(stage.index);
      this.audio.stageClear();
    }
    this.maxAlertThisStage = Math.max(this.maxAlertThisStage, this.farmer.alertness);
    if (this.maxAlertThisStage >= 85) this.stageGhost[this.stageIndex] = false;

    // Hiding: hold Down beside a haystack, bale or sack. The spots are
    // stage objects; the converter turns stage-relative x into screen x.
    if (!this.turkey.hidden && this.input.hideHeld && this.turkey.onGround) {
      const spot = this.turkey.tryHide(stage.hideSpots, (lx) => this.screenX(lx + stageStart(stage.index)));
      if (spot) {
        this.toast('HIDDEN — the farmer lost you', '#b8e986');
        this.audio.gobble();
      }
    } else if (this.turkey.hidden && !this.input.hideHeld) {
      this.turkey.leaveHide();
    }

    const wantSprint = this.input.sprintHeld;
    const speed = this.turkey.update(dt, stage.baseSpeed, wantSprint);
    if (speed > 0) {
      this.distance += speed * dt;
      this.score += speed * dt * 0.1;
      this.stepTimer -= dt;
      if (this.stepTimer <= 0 && this.turkey.onGround) {
        this.stepTimer = 0.34;
        this.audio.step();
      }
    }
    // Score stays fractional internally; the HUD floors it for display.

    if (this.input.jumpPressed || this.input.clicked) {
      if (this.turkey.jump()) this.audio.jump();
    }

    // Corn.
    const gained = collectCorn(this.turkey, this.corn, (wx) => this.screenX(wx));
    if (gained > 0) {
      this.score += gained;
      this.audio.corn();
    }

    // Farmer. The stage's base pace is what the farmer's chase is
    // measured against; sprinting genuinely opens the gap.
    const prevState = this.farmer.state;
    this.farmer.update(dt, this.turkey, stage.baseSpeed, this.distance);
    if (this.farmer.state === 'CHASE' && prevState !== 'CHASE') {
      this.toast('SPOTTED!', '#ff6a4a');
      this.audio.alarm();
      this.audio.gobble();
    }
    if (this.farmer.state === 'SEARCH' && prevState === 'CHASE') {
      this.toast('Hiding worked — he is searching', '#ffe9a8');
    }
    if (this.farmer.barkTimer > 0 && prevState !== 'CHASE') {
      // The farmer shouts when the chase begins.
    }

    // Hazards.
    this.hazards.update(dt, this.distance, (wx) => this.screenX(wx), this.turkey);
    const hit = this.hazards.checkHits(this.turkey, (wx) => this.screenX(wx));
    if (hit) {
      this.loseHeart(hit.type);
    } else {
      const fixed = this.hazards.checkFixedHits(this.turkey, this.distance, (wx) => this.screenX(wx), this.time);
      if (fixed) this.loseHeart(fixed.type);
    }

    // Fences and bales: run into one on the ground and stumble.
    for (const fence of stage.fences) {
      const fx = this.screenX(fence.x + stageStart(stage.index));
      const overlap =
        this.turkey.centerX > fx - fence.w / 2 &&
        this.turkey.centerX < fx + fence.w / 2 &&
        this.turkey.feetY > GROUND_Y - fence.h + 6;
      if (overlap && this.turkey.onGround && this.turkey.invulnerable <= 0) {
        this.turkey.y = GROUND_Y - this.turkey.h - 2;
        this.turkey.vy = -420;
        this.turkey.onGround = false;
        this.distance -= 26;
        this.shake = 0.5;
        this.audio.thud();
        this.toast('STUMBLE! Jump the fence!', '#ffe9a8');
      }
    }

    // Caught by the farmer.
    if (this.farmer.catches(this.turkey)) {
      this.loseHeart('farmer');
      if (this.state === 'playing') {
        this.turkey.x = TURKEY_SCREEN_X;
        this.turkey.y = GROUND_Y - this.turkey.h;
        this.turkey.vy = 0;
        this.turkey.onGround = true;
      }
    }

    // Escape!
    if (this.distance >= ESCAPE_DISTANCE) {
      this.distance = ESCAPE_DISTANCE;
      this.endRun('escaped');
      return;
    }

    this.audio.updateMusic(dt, this.farmer.state === 'CHASE');
  }

  render() {
    if (this.state === 'title') {
      drawTitle(ctx, this);
      return;
    }
    drawScene(ctx, this);
    if (this.state === 'playing' || this.state === 'paused') {
      drawHUD(ctx, this);
      if (this.state === 'paused') drawPause(ctx, this);
      return;
    }
    if (this.state === 'end') {
      drawEnd(ctx, this);
    }
  }

  frame(now) {
    const dt = Math.min(0.05, (now - (this.lastNow ?? now)) / 1000 || 0.016);
    this.lastNow = now;
    if (!this.shotMode) this.update(dt);
    this.render();
    this.input.endFrame();
    this.frames++;
    if (this.shotMode && this.frames >= 2) {
      window.__shotReady = true;
    }
    requestAnimationFrame((t) => this.frame(t));
  }
}

const { shot, seed } = readShotQuery();
const game = new Game(seed);
window.__game = game;
if (shot) {
  game.shotMode = true;
  applyShot(game, shot, seed);
  game.render();
  game.input.endFrame();
  window.__shotReady = true;
} else {
  requestAnimationFrame((t) => game.frame(t));
}

export { drawTurkey, STAGE_COUNT, ESCAPE_DISTANCE, clamp };
