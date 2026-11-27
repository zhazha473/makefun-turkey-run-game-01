// The HUD and the menus of Gobble Run, all drawn on the canvas so the
// screenshots show exactly what the player sees: score, distance,
// hearts, stamina, the farmer's alertness meter, the stage name, the
// corn count and the best distance — plus the title screen, the pause
// card, the stage banner and the caught / escaped end screens with a
// restart button.

import { GROUND_Y, STAGES, PX_PER_METER, stageAt } from './world.js';
import { clamp } from './random.js';

export function drawHeart(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = filled ? '#e03a2e' : 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.moveTo(0, 7);
  ctx.bezierCurveTo(-11, -4, -6, -13, 0, -7);
  ctx.bezierCurveTo(6, -13, 11, -4, 0, 7);
  ctx.fill();
  ctx.restore();
}

export function drawHUD(ctx, game) {
  const stage = stageAt(game.distance);
  const meters = Math.floor(game.distance / PX_PER_METER);
  ctx.save();
  // Top bar.
  ctx.fillStyle = 'rgba(30, 18, 8, 0.72)';
  ctx.fillRect(0, 0, 1280, 64);
  ctx.fillStyle = '#f2b13c';
  ctx.fillRect(0, 64, 1280, 3);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('SCORE', 20, 18);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(String(Math.floor(game.score)), 20, 42);

  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('DISTANCE', 190, 18);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`${meters} m`, 190, 42);

  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('STAGE', 350, 18);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`${stage.index + 1}/3 ${stage.name}`, 350, 42);

  // Corn count.
  ctx.fillStyle = '#f2c230';
  ctx.beginPath();
  ctx.ellipse(600, 32, 9, 15, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`× ${game.turkey.cornCollected}`, 616, 34);

  // Hearts.
  for (let i = 0; i < 3; i++) {
    drawHeart(ctx, 720 + i * 34, 32, i < game.lives);
  }

  // Stamina bar.
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('SPRINT', 830, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(830, 30, 130, 12);
  ctx.fillStyle = game.turkey.stamina > 25 ? '#7ec850' : '#e03a2e';
  ctx.fillRect(830, 30, 130 * clamp(game.turkey.stamina / 100, 0, 1), 12);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.strokeRect(830, 30, 130, 12);

  // Farmer alertness meter.
  const alert = game.farmer.alertness;
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(game.farmer.state === 'CHASE' ? 'FARMER: CHASING!' : game.farmer.state === 'SEARCH' ? 'FARMER: SEARCHING' : game.farmer.state === 'SUSPICIOUS' ? 'FARMER: SUSPICIOUS' : 'FARMER: CALM', 990, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(990, 30, 180, 12);
  ctx.fillStyle = alert >= 85 ? '#e03a2e' : alert >= 62 ? '#f2b13c' : '#7ec850';
  ctx.fillRect(990, 30, 180 * clamp(alert / 100, 0, 1), 12);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.strokeRect(990, 30, 180, 12);

  // Best distance, small, bottom left.
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`BEST ${Math.floor(game.bestDistance / PX_PER_METER)} m`, 16, 700);

  // Mute hint, bottom right.
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(game.muted ? 'M — sound OFF' : 'M — mute · P — pause', 1264, 700);

  // Stage banner.
  if (game.bannerT > 0) {
    const alpha = clamp(game.bannerT, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(30, 18, 8, 0.8)';
    ctx.fillRect(340, 150, 600, 86);
    ctx.strokeStyle = '#f2b13c';
    ctx.lineWidth = 3;
    ctx.strokeRect(340, 150, 600, 86);
    ctx.fillStyle = '#f2b13c';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stage.banner, 640, 182);
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px sans-serif';
    ctx.fillText(stage.subtitle, 640, 214);
    ctx.restore();
  }

  // Toasts (SPOTTED! / HIDDEN! / GHOST BONUS ...).
  let ty = 96;
  for (const toast of game.toasts) {
    const a = clamp(toast.t / 0.4, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = toast.color;
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(toast.text, 640, ty);
    ctx.restore();
    ty += 34;
  }
  ctx.restore();
}

function drawButton(ctx, rect, label, accent) {
  ctx.fillStyle = accent ? '#f2b13c' : 'rgba(255,255,255,0.16)';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = accent ? '#8a5a2b' : 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 3;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = accent ? '#3a2410' : '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
}

export function drawTitle(ctx, game) {
  ctx.save();
  // Warm dawn backdrop with the farmyard silhouette.
  const grad = ctx.createLinearGradient(0, 0, 0, 720);
  grad.addColorStop(0, '#f7c873');
  grad.addColorStop(0.55, '#f2a65a');
  grad.addColorStop(1, '#8a5a2b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(1050, 120, 56, 0, Math.PI * 2);
  ctx.fill();
  // Fence and haystacks along the bottom.
  ctx.fillStyle = '#7a4a21';
  ctx.fillRect(0, 560, 1280, 12);
  ctx.fillRect(0, 620, 1280, 100);
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.moveTo(120, 620);
  ctx.quadraticCurveTo(120, 520, 210, 500);
  ctx.quadraticCurveTo(300, 520, 300, 620);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(1020, 620);
  ctx.quadraticCurveTo(1020, 530, 1090, 514);
  ctx.quadraticCurveTo(1160, 530, 1160, 620);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#3a2410';
  ctx.font = 'bold 96px sans-serif';
  ctx.fillText('GOBBLE RUN', 640, 150);
  ctx.fillStyle = '#7a2e12';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('Escape the Thanksgiving Table', 640, 216);
  ctx.fillStyle = '#3a2410';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('3 stages · 6 hazards · 9 hiding spots · 72 corn', 640, 258);

  ctx.fillStyle = '#3a2410';
  ctx.font = '20px sans-serif';
  ctx.fillText('You are the turkey. The farmer is coming with his carving knife.', 640, 330);
  ctx.fillText('Run the farmyard, slip through the barn, and outrun the kitchen oven.', 640, 360);
  ctx.fillStyle = '#5d3416';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('SPACE / ↑ / CLICK — jump      ↓ / S — hide in the hay      SHIFT — sprint', 640, 412);
  ctx.fillText('Grab corn for points · stay unseen for the GHOST bonus · 3 hearts', 640, 442);
  ctx.fillStyle = '#7a2e12';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText('P — pause · M — mute · R — restart', 640, 472);

  drawButton(ctx, { x: 500, y: 510, w: 280, h: 62 }, '▶  START THE RUN', true);
  game.startButton = { x: 500, y: 510, w: 280, h: 62 };

  if (game.bestDistance > 0) {
    ctx.fillStyle = '#3a2410';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`Best distance this session: ${Math.floor(game.bestDistance / PX_PER_METER)} m`, 640, 610);
  }
  ctx.fillStyle = 'rgba(58,36,16,0.75)';
  ctx.font = '15px sans-serif';
  ctx.fillText('A complete original game · keyboard + mouse · plays offline', 640, 648);
  ctx.restore();
}

export function drawPause(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(20, 12, 5, 0.66)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText('PAUSED', 640, 300);
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px sans-serif';
  ctx.fillText('P or Esc — resume · R — restart the run', 640, 372);
  ctx.restore();
}

export function drawEnd(ctx, game) {
  const escaped = game.endKind === 'escaped';
  ctx.save();
  ctx.fillStyle = escaped ? 'rgba(20, 60, 20, 0.72)' : 'rgba(60, 16, 8, 0.74)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = escaped ? '#b8e986' : '#ff9d7a';
  ctx.font = 'bold 78px sans-serif';
  ctx.fillText(escaped ? 'YOU ESCAPED!' : 'CAUGHT!', 640, 150);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(
    escaped
      ? 'The turkey is free — no Thanksgiving dinner today.'
      : 'The farmer caught the turkey… but the table is set for next year.',
    640, 216,
  );
  ctx.font = '22px sans-serif';
  ctx.fillText(`Score ${Math.floor(game.score)} · Distance ${Math.floor(game.distance / PX_PER_METER)} m · Corn ${game.turkey.cornCollected} / 72`, 640, 268);
  ctx.fillText(`Times spotted ${game.farmer.spottedCount} · Stage reached ${stageAt(game.distance).index + 1} / 3`, 640, 300);
  ctx.fillStyle = '#f2b13c';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`Run rating: ${game.runRating}`, 640, 348);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px sans-serif';
  ctx.fillText('GHOST — never spotted · SHADOW — spotted once · SEEN — spotted twice or more', 640, 384);
  if (game.bestDistance > 0) {
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(`Best distance this session: ${Math.floor(game.bestDistance / PX_PER_METER)} m`, 640, 424);
  }
  drawButton(ctx, { x: 500, y: 470, w: 280, h: 62 }, '↻  RUN AGAIN', true);
  game.restartButton = { x: 500, y: 470, w: 280, h: 62 };
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '18px sans-serif';
  ctx.fillText('or press R to restart', 640, 566);
  ctx.restore();
}

export { STAGES, GROUND_Y };
