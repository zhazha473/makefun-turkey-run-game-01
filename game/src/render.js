// The look of Gobble Run: every sprite is drawn with Canvas 2D calls,
// no image files, in one warm autumn palette (orange, brown, gold) from
// the farmyard at dawn to the Thanksgiving kitchen. The renderer draws
// the world behind the turkey, the turkey and the farmer, the hazards,
// the corn and the drifting leaves, in that order, from the game's state.
//
// The turkey: a brown body, a fanned tail, a red wattle, a beak and
// worried eyes. The farmer: overalls, a straw hat, a pitchfork, and a
// "?" or "!" over his head when he suspects or chases.

import { GROUND_Y, STAGES, STAGE_LENGTH, TURKEY_SCREEN_X, stageAt, stageStart } from './world.js';
import { clamp } from './random.js';

const PALETTE = {
  turkeyBody: '#7a4a21',
  turkeyDark: '#5d3416',
  turkeyLight: '#a06a35',
  turkeyTail: '#8a5a2b',
  tailBand: '#d97b2f',
  wattle: '#c0392b',
  beak: '#e8a83c',
  farmerShirt: '#b03a2e',
  farmerOveralls: '#3a5a8a',
  farmerHat: '#d9a441',
  farmerSkin: '#e8b98a',
  cornGold: '#f2c230',
  cornHusk: '#5a8a3a',
  pumpkin: '#e07b28',
  knifeSteel: '#d8dde2',
  cleaverSteel: '#c8ccd2',
  flameA: '#ff9d2e',
  flameB: '#ff5a1f',
  flameC: '#ffd23e',
};

// --- scenery ---------------------------------------------------------------

function drawSky(ctx, stage, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, 620);
  grad.addColorStop(0, stage.sky[0]);
  grad.addColorStop(0.6, stage.sky[1]);
  grad.addColorStop(1, stage.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 620);
  if (stage.index === 0) {
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(1080, 110, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 233, 168, 0.35)';
    ctx.beginPath();
    ctx.arc(1080, 110, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 244, 214, 0.85)';
    for (const cx of stage.clouds) {
      const x = ((cx - time * 12) % 1500 + 1500) % 1500 - 110;
      ctx.beginPath();
      ctx.ellipse(x, 90, 70, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 46, 98, 52, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (stage.index === 2) {
    // Kitchen window: evening light and a hanging garland.
    ctx.fillStyle = '#f7c873';
    ctx.fillRect(90, 70, 220, 150);
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(90, 70, 220, 12);
    ctx.fillRect(195, 70, 12, 150);
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(104, 92, 86, 112);
    ctx.fillRect(216, 92, 80, 112);
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.arc(250, 150, 26, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(ctx, stage, distance) {
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, 1280, 100);
  ctx.fillStyle = stage.groundTop;
  ctx.fillRect(0, GROUND_Y, 1280, 14);
  ctx.fillStyle = stage.grass;
  const offset = distance % 90;
  for (let x = -90 + offset; x < 1280; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y);
    ctx.lineTo(x + 8, GROUND_Y - 12);
    ctx.lineTo(x + 16, GROUND_Y);
    ctx.fill();
  }
  if (stage.index === 1) {
    // Barn floorboards.
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let x = 0; x < 1280; x += 160) ctx.fillRect(x, GROUND_Y + 40, 3, 60);
  }
  if (stage.index === 2) {
    // Kitchen tiles.
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (let x = 0; x < 1280; x += 96) ctx.fillRect(x, GROUND_Y + 30, 2, 70);
    ctx.fillRect(0, GROUND_Y + 62, 1280, 2);
  }
}

function drawTrees(ctx, stage, distance) {
  if (stage.index !== 0) return;
  const base = stageStart(stage.index);
  ctx.fillStyle = '#6b4423';
  for (const tx of stage.trees) {
    const sx = TURKEY_SCREEN_X + (base + tx - distance);
    if (sx < -80 || sx > 1360) continue;
    ctx.fillRect(sx - 8, GROUND_Y - 190, 16, 190);
    ctx.fillStyle = '#c96a2e';
    ctx.beginPath();
    ctx.arc(sx, GROUND_Y - 220, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a83c';
    ctx.beginPath();
    ctx.arc(sx - 34, GROUND_Y - 190, 44, 0, Math.PI * 2);
    ctx.arc(sx + 38, GROUND_Y - 196, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b4423';
  }
}

function drawHaystack(ctx, x, kind) {
  if (kind === 'sacks') {
    ctx.fillStyle = '#c9a86a';
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y - 26, 52, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a8874a';
    ctx.beginPath();
    ctx.ellipse(x - 8, GROUND_Y - 52, 40, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a6a34';
    ctx.fillRect(x - 34, GROUND_Y - 40, 68, 4);
    return;
  }
  const h = kind === 'haybale' ? 62 : 96;
  const w = kind === 'haybale' ? 84 : 110;
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  if (kind === 'haybale') {
    ctx.ellipse(x, GROUND_Y - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(x - w / 2, GROUND_Y);
    ctx.quadraticCurveTo(x - w / 2, GROUND_Y - h, x, GROUND_Y - h - 18);
    ctx.quadraticCurveTo(x + w / 2, GROUND_Y - h, x + w / 2, GROUND_Y);
    ctx.closePath();
  }
  ctx.fill();
  ctx.strokeStyle = '#b5773a';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 16, GROUND_Y - h + 12);
    ctx.lineTo(x + i * 20, GROUND_Y - 8);
    ctx.stroke();
  }
}

function drawFence(ctx, x, w, h, stage) {
  ctx.fillStyle = '#7a4a21';
  ctx.fillRect(x - w / 2, GROUND_Y - h, 10, h);
  ctx.fillRect(x + w / 2 - 10, GROUND_Y - h, 10, h);
  ctx.fillStyle = '#96622f';
  ctx.fillRect(x - w / 2 - 6, GROUND_Y - h + 8, w + 12, 12);
  ctx.fillRect(x - w / 2 - 6, GROUND_Y - h / 2, w + 12, 12);
  ctx.fillStyle = stage.accent;
  ctx.fillRect(x - w / 2 - 6, GROUND_Y - h + 8, w + 12, 3);
}

function drawOven(ctx, x, w, h, time, bursting) {
  ctx.fillStyle = '#4a4a52';
  ctx.fillRect(x - w / 2, GROUND_Y - h, w, h);
  ctx.fillStyle = '#2e2e34';
  ctx.fillRect(x - w / 2 + 12, GROUND_Y - h + 18, w - 24, 96);
  ctx.fillStyle = '#1c1c22';
  ctx.fillRect(x - w / 2 + 22, GROUND_Y - h + 28, w - 44, 76);
  ctx.fillStyle = bursting ? PALETTE.flameB : '#3a2a18';
  ctx.fillRect(x - w / 2 + 26, GROUND_Y - h + 32, w - 52, 68);
  if (bursting) {
    // Flames lick out of the door and over the top of the oven.
    ctx.fillStyle = PALETTE.flameC;
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y - h + 60, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.flameB;
    ctx.beginPath();
    ctx.moveTo(x - 34, GROUND_Y - h + 6);
    ctx.quadraticCurveTo(x - 18, GROUND_Y - h - 52 - Math.sin(time * 18) * 8, x, GROUND_Y - h - 62);
    ctx.quadraticCurveTo(x + 18, GROUND_Y - h - 52 + Math.sin(time * 18) * 8, x + 34, GROUND_Y - h + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.flameA;
    ctx.beginPath();
    ctx.moveTo(x - 18, GROUND_Y - h + 6);
    ctx.quadraticCurveTo(x - 8, GROUND_Y - h - 30, x, GROUND_Y - h - 38);
    ctx.quadraticCurveTo(x + 8, GROUND_Y - h - 30, x + 18, GROUND_Y - h + 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#8a8a92';
  ctx.fillRect(x - w / 2 + 8, GROUND_Y - 14, w - 16, 8);
  ctx.fillStyle = '#f2b13c';
  ctx.beginPath();
  ctx.arc(x - 26, GROUND_Y - h + 8, 5, 0, Math.PI * 2);
  ctx.arc(x + 26, GROUND_Y - h + 8, 5, 0, Math.PI * 2);
  ctx.fill();
  // Label last and above the flame tongues, so a burst never hides it.
  ctx.fillStyle = '#c9c9d2';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OVEN', x, GROUND_Y - h - 72);
}

function drawStove(ctx, x, w, time) {
  ctx.fillStyle = '#3a3a42';
  ctx.fillRect(x - w / 2, GROUND_Y - 26, w, 26);
  const glow = 0.55 + 0.45 * Math.sin(time * 5 + x * 0.05);
  ctx.fillStyle = `rgba(255, 90, 31, ${0.55 + glow * 0.4})`;
  ctx.beginPath();
  ctx.ellipse(x - w / 4, GROUND_Y - 26, 26, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w / 4, GROUND_Y - 26, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d8dde2';
  ctx.fillRect(x - w / 2 + 10, GROUND_Y - 34, 14, 8);
  ctx.fillRect(x + w / 2 - 24, GROUND_Y - 34, 14, 8);
}

function drawCorn(ctx, x, y, bob) {
  const yy = y + Math.sin(bob) * 2;
  ctx.save();
  ctx.translate(x, yy);
  ctx.rotate(-0.5);
  ctx.fillStyle = PALETTE.cornGold;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9a41f';
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 5, -14);
    ctx.lineTo(i * 5, 14);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.cornHusk;
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.lineTo(-16, 22);
  ctx.lineTo(-2, 16);
  ctx.closePath();
  ctx.moveTo(8, 6);
  ctx.lineTo(16, 22);
  ctx.lineTo(2, 16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// --- the turkey ------------------------------------------------------------

export function drawTurkey(ctx, turkey, time) {
  const x = turkey.x;
  const y = turkey.y;
  const w = turkey.w;
  const h = turkey.h;
  if (turkey.invulnerable > 0 && Math.floor(time * 12) % 2 === 0) return;
  ctx.save();
  if (turkey.hidden) {
    // Only the tail feathers poke out of the hay.
    ctx.translate(x + w / 2, GROUND_Y - 6);
    ctx.fillStyle = PALETTE.turkeyTail;
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.rotate(i * 0.28);
      ctx.beginPath();
      ctx.ellipse(0, -26, 9, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = PALETTE.tailBand;
    ctx.beginPath();
    ctx.ellipse(0, -44, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  const bob = turkey.onGround ? Math.sin(turkey.runCycle * 2.2) * 3 : 0;
  const legSwing = turkey.onGround ? Math.sin(turkey.runCycle * 2.2) * 10 : 6;
  ctx.translate(x + w / 2, y + h + bob * 0.3);
  // Tail fan.
  ctx.fillStyle = PALETTE.turkeyTail;
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.rotate(-0.5 + i * 0.25 + (turkey.onGround ? 0 : -0.2));
    ctx.beginPath();
    ctx.ellipse(-26, -46, 8, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.tailBand;
    ctx.beginPath();
    ctx.ellipse(-26, -68, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyTail;
    ctx.restore();
  }
  // Legs.
  ctx.strokeStyle = '#e8a83c';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-4, -8);
  ctx.lineTo(-4 + legSwing, 0);
  ctx.moveTo(8, -8);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  // Body.
  ctx.fillStyle = PALETTE.turkeyBody;
  ctx.beginPath();
  ctx.ellipse(0, -34, 30, 26, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.turkeyLight;
  ctx.beginPath();
  ctx.ellipse(4, -26, 20, 16, -0.15, 0, Math.PI * 2);
  ctx.fill();
  // Wing.
  ctx.fillStyle = PALETTE.turkeyDark;
  ctx.beginPath();
  ctx.ellipse(-2, -36, 18, 12, -0.5 + (turkey.onGround ? Math.sin(turkey.runCycle * 2.2) * 0.25 : -0.7), 0, Math.PI * 2);
  ctx.fill();
  // Neck and head.
  ctx.strokeStyle = PALETTE.turkeyBody;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(18, -52);
  ctx.quadraticCurveTo(30, -66, 30, -76);
  ctx.stroke();
  ctx.fillStyle = '#e8c39a';
  ctx.beginPath();
  ctx.arc(31, -80, 12, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = PALETTE.beak;
  ctx.beginPath();
  ctx.moveTo(40, -84);
  ctx.lineTo(54, -79);
  ctx.lineTo(40, -74);
  ctx.closePath();
  ctx.fill();
  // Wattle.
  ctx.fillStyle = PALETTE.wattle;
  ctx.beginPath();
  ctx.ellipse(38, -70, 5, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye: wide with worry when the farmer is close.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(34, -84, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1c22';
  ctx.beginPath();
  ctx.arc(36, -84, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (turkey.hurtFlash > 0) {
    ctx.fillStyle = `rgba(200, 30, 20, ${clamp(turkey.hurtFlash, 0, 0.4)})`;
    ctx.fillRect(0, 0, 1280, 720);
  }
}

// --- the farmer ------------------------------------------------------------

export function drawFarmer(ctx, farmer, time) {
  const x = farmer.x;
  const baseY = GROUND_Y;
  const swing = Math.sin(farmer.walkCycle * 2) * 8;
  const speed = farmer.state === 'CHASE' ? 1.5 : 1;
  ctx.save();
  ctx.translate(x + farmer.w / 2, baseY);
  // Legs (overalls).
  ctx.strokeStyle = farmer.state === 'CHASE' ? '#2e4a72' : PALETTE.farmerOveralls;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-8, -52);
  ctx.lineTo(-8 + swing * speed, 0);
  ctx.moveTo(8, -52);
  ctx.lineTo(8 - swing * speed, 0);
  ctx.stroke();
  // Body: shirt and overalls.
  ctx.fillStyle = PALETTE.farmerShirt;
  ctx.fillRect(-22, -96, 44, 48);
  ctx.fillStyle = PALETTE.farmerOveralls;
  ctx.fillRect(-20, -70, 40, 24);
  ctx.fillStyle = '#f2b13c';
  ctx.fillRect(-20, -72, 40, 5);
  // Arms: one holds a pitchfork, the other reaches forward in a chase.
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-18, -88);
  ctx.lineTo(-30, -52);
  ctx.moveTo(18, -88);
  ctx.lineTo(farmer.state === 'CHASE' ? 40 : 30, farmer.state === 'CHASE' ? -78 : -60);
  ctx.stroke();
  // Pitchfork.
  ctx.strokeStyle = '#8a6a34';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-30, -52);
  ctx.lineTo(-38, -128);
  ctx.stroke();
  ctx.strokeStyle = '#d8dde2';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-38 + i * 7, -128);
    ctx.lineTo(-38 + i * 9, -146);
    ctx.stroke();
  }
  // Head and straw hat.
  ctx.fillStyle = PALETTE.farmerSkin;
  ctx.beginPath();
  ctx.arc(0, -104, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerHat;
  ctx.beginPath();
  ctx.ellipse(0, -114, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-12, -132, 24, 18);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(-12, -118, 24, 4);
  // Moustache and angry brows when chasing.
  ctx.fillStyle = '#5d3416';
  ctx.fillRect(-10, -98, 20, 4);
  if (farmer.state === 'CHASE' || farmer.state === 'SUSPICIOUS') {
    ctx.strokeStyle = '#5d3416';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -112);
    ctx.lineTo(-2, -108);
    ctx.moveTo(10, -112);
    ctx.lineTo(2, -108);
    ctx.stroke();
  }
  ctx.restore();
  // The mark over his head.
  if (farmer.mark) {
    const pulse = farmer.state === 'CHASE' ? 1 + Math.sin(time * 8) * 0.12 : 1;
    ctx.save();
    ctx.translate(x + farmer.w / 2, baseY - 168);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = farmer.state === 'CHASE' ? '#c0392b' : '#f2b13c';
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(farmer.mark, 0, 1);
    ctx.restore();
  }
}

// --- hazards ---------------------------------------------------------------

function drawKnife(ctx, hz, screenX) {
  const sx = screenX(hz.x);
  if (hz.state === 'warn') {
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.beginPath();
    ctx.ellipse(sx, GROUND_Y + 4, 26 + Math.sin(hz.t * 10) * 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', sx, GROUND_Y - 96);
    return;
  }
  if (hz.state === 'gone') return;
  ctx.save();
  ctx.translate(sx, hz.y + 46);
  ctx.rotate(0.12);
  ctx.fillStyle = PALETTE.knifeSteel;
  ctx.beginPath();
  ctx.moveTo(-7, -46);
  ctx.lineTo(7, -46);
  ctx.lineTo(0, 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5d3416';
  ctx.fillRect(-8, 30, 16, 16);
  ctx.restore();
}

function drawPumpkin(ctx, hz, screenX, time) {
  const sx = screenX(hz.x);
  ctx.save();
  ctx.translate(sx, GROUND_Y - 26);
  ctx.rotate(hz.phase);
  ctx.fillStyle = PALETTE.pumpkin;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b85a1a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 22, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#5a8a3a';
  ctx.fillRect(-3, -30, 6, 10);
  ctx.restore();
}

function drawSnare(ctx, hz, screenX, time) {
  const sx = screenX(hz.x);
  ctx.strokeStyle = hz.snared > 0 ? '#c0392b' : '#8a6a34';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(sx, GROUND_Y - 4, 34, 8, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#5d3416';
  ctx.beginPath();
  ctx.arc(sx, GROUND_Y - 4, 5, 0, Math.PI * 2);
  ctx.fill();
  if (hz.snared > 0) {
    ctx.fillStyle = 'rgba(192,57,43,0.25)';
    ctx.beginPath();
    ctx.ellipse(sx, GROUND_Y - 30, 30, 34, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCleaver(ctx, hz, screenX, time) {
  const sx = screenX(hz.x);
  const pivotY = GROUND_Y - 260;
  const angle = hz.angle ?? Math.sin(time * 1.9 + hz.x * 0.07) * 0.85;
  const bx = sx + Math.sin(angle) * hz.rope;
  const by = pivotY + Math.cos(angle) * hz.rope;
  ctx.strokeStyle = '#8a6a34';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sx, pivotY);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(angle);
  ctx.fillStyle = PALETTE.cleaverSteel;
  ctx.fillRect(-14, -8, 28, 62);
  ctx.fillStyle = '#5d3416';
  ctx.fillRect(-14, -20, 28, 14);
  ctx.restore();
}

function drawFlame(ctx, x, time, bursting) {
  const sx = x;
  if (!bursting) {
    ctx.fillStyle = 'rgba(255, 157, 46, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, GROUND_Y - 40, 40, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const flick = Math.sin(time * 22) * 8;
  ctx.fillStyle = PALETTE.flameB;
  ctx.beginPath();
  ctx.moveTo(sx - 52, GROUND_Y);
  ctx.quadraticCurveTo(sx - 30, GROUND_Y - 150 - flick, sx, GROUND_Y - 165);
  ctx.quadraticCurveTo(sx + 30, GROUND_Y - 150 + flick, sx + 52, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.flameA;
  ctx.beginPath();
  ctx.moveTo(sx - 34, GROUND_Y);
  ctx.quadraticCurveTo(sx - 18, GROUND_Y - 110 - flick, sx, GROUND_Y - 122);
  ctx.quadraticCurveTo(sx + 18, GROUND_Y - 110 + flick, sx + 34, GROUND_Y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.flameC;
  ctx.beginPath();
  ctx.ellipse(sx, GROUND_Y - 34, 16, 30, 0, 0, Math.PI * 2);
  ctx.fill();
}

// --- the whole scene ---------------------------------------------------------

export function drawScene(ctx, game) {
  const stage = stageAt(game.distance);
  const time = game.time;
  const screenX = (wx) => TURKEY_SCREEN_X + (wx - game.distance);

  ctx.clearRect(0, 0, 1280, 720);
  if (game.shake > 0) {
    const s = game.shake * 8;
    ctx.save();
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }

  drawSky(ctx, stage, time);
  if (stage.index === 1) {
    // Barn beams and hanging lantern light (warm, not night).
    ctx.fillStyle = '#3a2410';
    ctx.fillRect(0, 0, 1280, 60);
    ctx.fillStyle = '#5d3416';
    for (let x = 0; x < 1280; x += 220) ctx.fillRect(x, 0, 26, 120);
    ctx.fillStyle = 'rgba(242, 177, 60, 0.16)';
    ctx.beginPath();
    ctx.ellipse(640, 200, 420, 200, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (stage.index === 2) {
    // Kitchen counter along the back wall.
    ctx.fillStyle = '#5d3416';
    ctx.fillRect(0, 470, 1280, 26);
    ctx.fillStyle = '#8a5a2e';
    ctx.fillRect(0, 470, 1280, 8);
    ctx.fillStyle = '#c9c9d2';
    ctx.fillRect(60, 420, 120, 50);
    ctx.fillRect(1120, 420, 100, 50);
    ctx.fillStyle = '#8a8a92';
    ctx.fillRect(60, 420, 120, 8);
    ctx.fillRect(1120, 420, 100, 8);
    ctx.fillStyle = '#5d3416';
    ctx.fillRect(110, 404, 20, 16);
    ctx.fillRect(1155, 404, 20, 16);
    ctx.fillStyle = '#e07b28';
    ctx.beginPath();
    ctx.arc(300, 448, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a8a3a';
    ctx.beginPath();
    ctx.arc(950, 448, 22, 0, Math.PI * 2);
    ctx.fill();
  }
  drawTrees(ctx, stage, game.distance);

  // Fixed furniture: ovens, stoves, fences, hide spots. Their x is
  // stage-relative in the world data, so add the stage's world offset.
  const base = stageStart(stage.index);
  const localToScreen = (lx) => screenX(base + lx);
  for (const oven of stage.ovens) {
    const wx = base + oven.x;
    const sx = screenX(wx);
    if (sx < -200 || sx > 1480) continue;
    const cycle = (time + wx * 0.13) % 2.6;
    drawOven(ctx, sx, oven.w, oven.h, time, cycle > 1.9);
  }
  for (const stove of stage.stoves) {
    const sx = localToScreen(stove.x);
    if (sx < -220 || sx > 1500) continue;
    drawStove(ctx, sx, stove.w, time);
  }
  for (const fence of stage.fences) {
    const sx = localToScreen(fence.x);
    if (sx < -120 || sx > 1400) continue;
    drawFence(ctx, sx, fence.w, fence.h, stage);
  }
  for (const spot of stage.hideSpots) {
    const sx = localToScreen(spot.x);
    if (sx < -160 || sx > 1440) continue;
    drawHaystack(ctx, sx, spot.kind);
    if (game.turkey.hidden && game.turkey.hideSpot === spot) {
      // The turkey is in here: draw its tail over the hay.
      drawTurkey(ctx, game.turkey, time);
    }
  }

  // Corn.
  for (const cob of game.corn) {
    if (cob.taken) continue;
    const sx = screenX(cob.x);
    if (sx < -40 || sx > 1320) continue;
    drawCorn(ctx, sx, cob.y, time * 3 + cob.x);
  }

  // Procedural hazards.
  for (const hz of game.hazards.hazards) {
    const sx = screenX(hz.x);
    if (sx < -260 || sx > 1540) continue;
    if (hz.type === 'knife') drawKnife(ctx, hz, screenX);
    else if (hz.type === 'pumpkin') drawPumpkin(ctx, hz, screenX, time);
    else if (hz.type === 'snare') drawSnare(ctx, hz, screenX, time);
    else if (hz.type === 'cleaver') drawCleaver(ctx, hz, screenX, time);
    else if (hz.type === 'flame') drawFlame(ctx, sx, time, (hz.t % 2.6) > 1.9);
  }
  // Fixed cleavers (barn beams / kitchen hooks).
  for (const c of stage.cleavers) {
    const wx = base + c.x;
    const sx = screenX(wx);
    if (sx < -200 || sx > 1480) continue;
    drawCleaver(ctx, { x: wx, rope: c.rope, angle: Math.sin((time + wx * 0.07) * 1.9) * 0.85 }, screenX, time);
  }

  // Drifting leaves in the farmyard.
  if (stage.index === 0) {
    for (const leaf of game.leaves) {
      const lx = ((leaf.x - game.distance * 0.2 + time * leaf.speed) % 1400 + 1400) % 1400 - 60;
      const ly = leaf.y + Math.sin(time * leaf.sway + leaf.phase) * 14;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(Math.sin(time + leaf.phase) * 0.8);
      ctx.fillStyle = leaf.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size, leaf.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawGround(ctx, stage, game.distance);

  // The farmer, then the turkey (unless hidden inside a haystack).
  drawFarmer(ctx, game.farmer, time);
  if (!game.turkey.hidden) drawTurkey(ctx, game.turkey, time);

  if (game.shake > 0) ctx.restore();
}

export { PALETTE };
