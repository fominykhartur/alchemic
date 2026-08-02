import { ELEMENTS, ELEMENT_IDS, RECIPES, recipeKey, UNLOCKABLE_STARTERS } from './data.js';
import { drawGlyph, lightenColor, GLYPH_PATHS, ICON_DESIGNS, SHAPE_POLYGONS } from './icons.js';
import { state } from './state.js';
import { playMix, playExplode, playDiscover } from './audio.js';
import { log, updateUI, checkAchievements, showWhisperToast } from './ui.js';
import { maybeAddWhisper, resolveWhispers, onOracleUnlocked } from './notebook.js';

export const canvas = document.getElementById('game-canvas');
export const ctx = canvas.getContext('2d');
export let W, H, CX, CY, RADIUS;

export function resizeCanvas() {
  const panel = document.getElementById('center-panel');
  const controls = document.getElementById('cauldron-controls');
  const availW = panel.clientWidth - 10;
  const availH = panel.clientHeight - controls.offsetHeight - 14;
  const isMobile = window.innerWidth < 768;
  const size = Math.min(availW, availH, isMobile ? Infinity : 600);
  canvas.width = size;
  canvas.height = size;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  W = canvas.width;
  H = canvas.height;
  CX = W / 2;
  CY = H / 2;
  RADIUS = Math.min(W, H) * 0.4;
}

let time = 0;
let shakeTimer = 0;
let shakeIntensity = 0;
let animProgress = 0;
let animType = '';
let animData = null;

function drawScene() {
  ctx.save();
  if (shakeTimer > 0) {
    const sx = (Math.random() - 0.5) * shakeIntensity;
    const sy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(sx, sy);
    shakeTimer--;
  }
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, W, H);
  drawCircle();
  drawCapacityIndicator();
  const entries = Object.entries(state.cauldron);
  if (entries.length > 0 && !state.animating) {
    drawCauldronElements();
    drawCauldronSigils();
  }
  if (entries.length === 0 && !state.animating) drawDropHint();
  if (state.animating) drawAnimation();
  drawAmbientParticles();
  ctx.restore();
}

function drawCircle() {
  const t = time * 0.001;
  const grad = ctx.createRadialGradient(CX, CY, RADIUS * 0.5, CX, CY, RADIUS * 0.95);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.7, 'rgba(45,3,53,0.1)');
  grad.addColorStop(1, 'rgba(255,215,0,0.03)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS * 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,0,0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS + 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,215,0,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,215,0,0.1)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS * 0.65, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  const runes = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ','ᛈ','ᛇ','ᛉ','ᛊ','ᛏ','ᛒ','ᛖ','ᛗ','ᛚ','ᛝ','ᛟ','ᛞ'];
  const count = runes.length;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + t * 0.02;
    const r = RADIUS + 12 + Math.sin(t * 0.5 + i) * 2;
    const x = CX + Math.cos(angle) * r;
    const y = CY + Math.sin(angle) * r;
    ctx.fillStyle = `rgba(255,215,0,${0.1 + 0.05 * Math.sin(t * 0.03 + i)})`;
    ctx.font = '10px "Noto Sans Runic", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(runes[i % runes.length], x, y);
  }
  const pulse = 0.8 + 0.2 * Math.sin(t * 0.8);
  ctx.fillStyle = `rgba(255,215,0,${0.08 * pulse})`;
  ctx.font = '28px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✧', CX, CY);
}

function drawCapacityIndicator() {
  const total = Object.values(state.cauldron).reduce((s, v) => s + v, 0);
  const cap = 10;
  const frac = total / cap;

  // Fullness arc on outer ring
  if (total > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(255,215,0,${0.3 + 0.5 * frac})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(CX, CY, RADIUS + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();
    ctx.restore();
  }

  // Text indicator
  const textAlpha = 0.5 + 0.4 * frac;
  ctx.save();
  ctx.globalAlpha = textAlpha;
  ctx.fillStyle = '#ffd700';
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${total}/${cap}`, CX + RADIUS - 2, CY - RADIUS + 16);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawDropHint() {
  const t = time * 0.001;
  const alpha = 0.3 + 0.15 * Math.sin(t);
  ctx.fillStyle = `rgba(255,215,0,${alpha})`;
  ctx.font = '16px Alegreya, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Перетащите элементы сюда', CX, CY);
  ctx.font = '28px serif';
  ctx.fillStyle = `rgba(255,215,0,${alpha * 0.5})`;
  ctx.fillText('⟐', CX, CY - 30);
}

function drawCauldronElements() {
  const entries = Object.entries(state.cauldron);
  const count = entries.length;
  if (count === 0) return;
  const t = time * 0.001;
  const items = [];
  entries.forEach(([id, qty], i) => {
    const el = ELEMENTS[id];
    if (!el) return;
    const design = ICON_DESIGNS[id];
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const targetDist = RADIUS * 0.4;
    const entryTime = state.cauldronEntryTime[id] || 0;
    const age = time - entryTime;
    const animDuration = 400;
    let animT = Math.min(1, age / animDuration);
    const easeOut = 1 - Math.pow(1 - animT, 3);
    let dist = targetDist + (RADIUS * 0.8 - targetDist) * (1 - easeOut);

    // Settle bounce after fly-in
    let distOffset = 0;
    if (animT >= 1) {
      const settleAge = age - animDuration;
      distOffset = -6 * Math.exp(-settleAge / 180) * Math.sin(settleAge / 80 * Math.PI);
    }
    dist += distOffset;

    // Idle float after settle
    let floatY = 0;
    if (age > animDuration + 400) {
      floatY = Math.sin(t * 0.8 + i * 1.7) * 1.2;
    }

    const alpha = 0.3 + 0.7 * animT;
    const baseX = CX + Math.cos(angle) * dist;
    const baseY = CY + Math.sin(angle) * dist;
    const x = baseX;
    const y = baseY + floatY;
    items.push({ id, qty, el, design, i, x, y, alpha, angle, baseX, baseY, floatY });
  });
  if (items.length === 0) return;

  // Connecting constellation lines with animated dashes
  if (items.length > 1) {
    ctx.save();
    ctx.setLineDash([2, 6]);
    ctx.lineDashOffset = -t * 12;
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      const b = items[(i + 1) % items.length];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(255,215,0,0.12)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Spawn element sparkles
  if (Math.random() < 0.3 && items.length > 0) {
    const src = items[Math.floor(Math.random() * items.length)];
    const sparkleAngle = Math.random() * Math.PI * 2;
    const sparkleDist = 6 + Math.random() * 10;
    state.particles.push({
      x: src.x + Math.cos(sparkleAngle) * sparkleDist,
      y: src.y + Math.sin(sparkleAngle) * sparkleDist,
      vx: Math.cos(sparkleAngle) * 0.2,
      vy: Math.sin(sparkleAngle) * 0.2 - 0.3,
      life: 0.4 + Math.random() * 0.4,
      color: src.el.glow || 'rgba(255,215,0,0.6)',
      size: 0.8 + Math.random() * 1.2,
    });
  }

  items.forEach(({ id, qty, el, design, i, x, y, alpha }) => {
    const gData = design ? GLYPH_PATHS[design.glyph] : null;
    const pulse = 1 + 0.05 * Math.sin(t * 0.5 + i);
    const r = 14 * pulse;
    ctx.globalAlpha = alpha;

    // Pulsing ambient glow
    const glowPulse = 0.7 + 0.3 * Math.sin(t * 0.6 + i * 1.1);
    const glowR = gData?.useShapeFill ? 14 : 22;
    const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, glowR * (0.85 + 0.15 * glowPulse));
    glowGrad.addColorStop(0, el.glow || 'rgba(255,255,255,0.2)');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Enhanced outer glow for legendary elements
    if (design?.glow) {
      const legendR = 26;
      const legendGrad = ctx.createRadialGradient(x, y, 0, x, y, legendR);
      legendGrad.addColorStop(0, el.glow || 'rgba(255,215,0,0.15)');
      legendGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = legendGrad;
      ctx.beginPath();
      ctx.arc(x, y, legendR, 0, Math.PI * 2);
      ctx.fill();
    }

    if (design?.shape) {
      const lighter = lightenColor(el.color, 40);
      const shapeGrad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
      shapeGrad.addColorStop(0, lighter);
      shapeGrad.addColorStop(1, el.color);

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.shadowColor = el.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = shapeGrad;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Highlight
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();
      const hlGrad = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x, y, r * 0.7);
      hlGrad.addColorStop(0, 'rgba(255,255,255,0.12)');
      hlGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = hlGrad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();

      // Goldish rim
      ctx.beginPath();
      ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,215,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }

    // Glyph
    drawGlyph(ctx, id, x, y, 0.8);

    // Name plate with quantity badge
    const label = el.name;
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    const textW = ctx.measureText(label).width;
    const plateW = textW + 8;
    const plateH = 12;
    const plateX = x - plateW / 2;
    const plateY = y + 19;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(plateX, plateY, plateW, plateH, 3);
    } else {
      ctx.rect(plateX, plateY, plateW, plateH);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(label, x, y + 25);

    if (qty > 1) {
      const badgeText = '' + qty;
      ctx.font = 'bold 7px sans-serif';
      const bw = ctx.measureText(badgeText).width;
      const bpad = 3;
      const br = Math.max(5, bw / 2 + bpad);
      const bx = x + plateW / 2 + br + 1;
      const by = y + 25;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,215,0,0.4)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,215,0,0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, bx, by + 0.5);
    }

    ctx.globalAlpha = 1;
  });
}

function drawCauldronSigils() {
  const entries = Object.entries(state.cauldron);
  if (entries.length === 0) return;
  const t = time * 0.001;
  const baseAngle = t * 0.15;
  const count = entries.length;
  entries.forEach(([id, qty], i) => {
    const color = ELEMENTS[id]?.color || '#888';
    for (let j = 0; j < 2; j++) {
      const angle = baseAngle + (i / count) * Math.PI * 2 + j * Math.PI;
      const dist = RADIUS + 16 + Math.sin(t * 0.4 + i + j * 2) * 3;
      const sx = CX + Math.cos(angle) * dist;
      const sy = CY + Math.sin(angle) * dist;
      const alpha = 0.2 + 0.15 * Math.sin(t + i * 0.7 + j * 1.3);
      drawGlyph(ctx, id, sx, sy, 0.7, color, alpha);
    }
  });
}

function drawAmbientParticles() {
  state.particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= 0.005;
    if (p.life < 0) p.life = 0;
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color || '#ffd700';
    const size = p.size || 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  state.particles = state.particles.filter(p => p.life > 0);
}

function spawnAmbientParticles() {
  state.particles.push({
    x: CX + (Math.random() - 0.5) * RADIUS * 1.8,
    y: CY + (Math.random() - 0.5) * RADIUS * 1.8,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    life: 0.5 + Math.random() * 1.5,
    color: `rgba(255,215,0,${0.1 + Math.random() * 0.2})`,
    size: 1 + Math.random() * 2,
  });
}

function startMixAnimation(recipe, dominantId) {
  state.animating = true;
  animType = 'mix';
  animProgress = 0;
  const entries = Object.entries(state.cauldron);
  animData = {
    recipe, dominantId,
    orbs: entries.map(([id, qty], i) => {
      const angle = (i / entries.length) * Math.PI * 2 - Math.PI / 2;
      return { id, qty, x: CX + Math.cos(angle) * RADIUS * 0.4, y: CY + Math.sin(angle) * RADIUS * 0.4, color: ELEMENTS[id].color };
    }),
    resultId: recipe.output,
    resultColor: ELEMENTS[recipe.output].color,
    progress: 0, phase: 'converge',
  };
}

function startExplosionAnimation() {
  state.animating = true;
  animType = 'explode';
  animProgress = 0;
  shakeTimer = 15;
  shakeIntensity = 6;
  const entries = Object.entries(state.cauldron);
  animData = {
    orbs: entries.map(([id, qty]) => {
      const angle = Math.random() * Math.PI * 2;
      return { id, qty, x: CX + Math.cos(angle) * RADIUS * 0.3, y: CY + Math.sin(angle) * RADIUS * 0.3, color: ELEMENTS[id].color, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8 - 2 };
    }),
    particles: [], progress: 0, phase: 'burst',
  };
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    animData.particles.push({ x: CX, y: CY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.5 + Math.random() * 0.8, color: `hsl(${Math.random() * 60 + 10}, 100%, ${50 + Math.random() * 30}%)`, size: 1.5 + Math.random() * 3 });
  }
}

function startDiscoveryAnimation(elementId) {
  state.animating = true;
  animType = 'discover';
  animProgress = 0;
  animData = { elementId, color: ELEMENTS[elementId].color, name: ELEMENTS[elementId].name, progress: 0, phase: 'reveal', particles: [] };
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    animData.particles.push({ x: CX, y: CY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.8 + Math.random() * 0.6, color: ELEMENTS[elementId].color, size: 1 + Math.random() * 2.5 });
  }
  shakeTimer = 8;
  shakeIntensity = 3;
}

function drawAnimation() {
  if (!animData) return;
  if (animType === 'mix') drawMixAnim();
  else if (animType === 'explode') drawExplodeAnim();
  else if (animType === 'discover') drawDiscoverAnim();
}

function drawMixAnim() {
  const d = animData;
  d.progress += 0.015;
  d.orbs.forEach(orb => {
    const targetX = CX + (Math.random() - 0.5) * 6;
    const targetY = CY + (Math.random() - 0.5) * 6;
    orb.x += (targetX - orb.x) * 0.05;
    orb.y += (targetY - orb.y) * 0.05;
    ctx.fillStyle = orb.color;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  if (d.progress > 0.5 && d.progress < 0.65) {
    const flash = (d.progress - 0.5) / 0.15;
    const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, RADIUS * 0.5 * flash);
    grad.addColorStop(0, `rgba(255,255,255,${flash * 0.8})`);
    grad.addColorStop(0.5, `rgba(255,215,0,${flash * 0.4})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(CX, CY, RADIUS * 0.5 * flash, 0, Math.PI * 2);
    ctx.fill();
  }
  if (d.progress > 0.6) {
    const r = Math.min(1, (d.progress - 0.6) / 0.3) * 18;
    const alpha = Math.min(1, (d.progress - 0.6) / 0.15);
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, r + 8);
    grad.addColorStop(0, d.resultColor);
    grad.addColorStop(0.6, d.resultColor);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(CX, CY, r + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = d.resultColor;
    ctx.shadowBlur = 20;
    ctx.fillStyle = d.resultColor;
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  if (d.progress >= 1) finishMix();
}

function drawExplodeAnim() {
  const d = animData;
  d.progress += 0.02;
  d.orbs.forEach(orb => {
    orb.x += orb.vx || 0;
    orb.y += orb.vy || 0;
    if (orb.vy !== undefined) orb.vy += 0.1;
    ctx.fillStyle = orb.color;
    ctx.globalAlpha = Math.max(0, 1 - d.progress * 1.5);
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  d.particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.96; p.vy *= 0.96; p.vy += 0.05;
    p.life -= 0.012;
    if (p.life > 0) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
  if (d.progress < 0.3) {
    const r = (d.progress / 0.3) * RADIUS * 0.5;
    ctx.strokeStyle = `rgba(255,200,50,${0.3 * (1 - d.progress / 0.3)})`;
    ctx.lineWidth = 3 * (1 - d.progress / 0.3);
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (d.progress >= 1) finishExplosion();
}

function drawDiscoverAnim() {
  const d = animData;
  d.progress += 0.012;
  d.particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.97; p.vy *= 0.97;
    p.life -= 0.008;
    if (p.life > 0) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
  const pulse = 0.5 + 0.5 * Math.sin(d.progress * Math.PI * 4);
  const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, RADIUS * 0.3 * pulse);
  grad.addColorStop(0, d.color);
  grad.addColorStop(0.3, d.color + '66');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(CX, CY, RADIUS * 0.3 * pulse, 0, Math.PI * 2);
  ctx.fill();
  if (d.progress > 0.3) {
    const textAlpha = Math.min(1, (d.progress - 0.3) / 0.3);
    ctx.globalAlpha = textAlpha;
    ctx.fillStyle = d.color;
    ctx.font = 'bold 24px Alegreya, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = d.color;
    ctx.shadowBlur = 20;
    ctx.fillText('✦ ' + d.name + ' ✦', CX, CY);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  if (d.progress >= 1) finishDiscovery();
}

function finishMix() {
  const recipe = animData.recipe;
  const outputId = recipe.output;
  const output = ELEMENTS[outputId];

  recipe.inputs.forEach(inp => {
    const id = inp.id;
    const amt = inp.a;
    state.cauldron[id] -= amt;
    if (state.cauldron[id] <= 0) { delete state.cauldron[id]; delete state.cauldronEntryTime[id]; }
  });

  state.cauldron[outputId] = (state.cauldron[outputId] || 0) + 1;
  state.cauldronEntryTime[outputId] = performance.now();

  const rkey = recipeKey(recipe);
  state.foundRecipes.add(rkey);

  const isNew = !state.discovered.has(outputId);
  if (isNew) {
    state.discovered.add(outputId);
    state.inventory[outputId] = 3;
    log(`✦ Открыт новый элемент: ${output.name}!`, 'discovery');
    // Открыть стартеры за вратами
    UNLOCKABLE_STARTERS.forEach(s => {
      if (outputId === s.unlockedBy && !state.discovered.has(s.id)) {
        state.discovered.add(s.id);
        state.inventory[s.id] = 9;
        log(`✦ Открыта новая стихия-врата: ${ELEMENTS[s.id].name}!`, 'discovery');
      }
    });
  } else {
    state.inventory[outputId] = (state.inventory[outputId] || 0) + 3;
    log(`✓ Создан ${output.name}`, 'success');
  }

  state.stats.mixCount++;
  state.stats.totalCreated += 3;
  state.stats.elementCreatedCount[outputId] = (state.stats.elementCreatedCount[outputId] || 0) + 3;
  checkAchievements();

  if (isNew) {
    if (outputId === 'mirror') {
      onOracleUnlocked('oracle');
      log('🔮 Зеркало отражает грань грядущего — Гримуар шепчет', 'discovery');
    } else if (outputId === 'chronomancer') {
      onOracleUnlocked('prophecy');
      log('✨ Хрономант прозревает нити времени — предвидение обострилось', 'discovery');
    }
  }
  if (resolveWhispers(outputId) > 0) showWhisperToast();
  maybeAddWhisper();

  if (isNew) {
    startDiscoveryAnimation(outputId);
    playDiscover();
  } else {
    playMix();
    updateUI();
    state.animating = false;
    animData = null;
  }
}

function finishExplosion() {
  const totalUnits = Object.values(state.cauldron).reduce((s, v) => s + v, 0);
  const types = Object.keys(state.cauldron).length;
  const explodedTypes = Object.keys(state.cauldron).sort();
  if (explodedTypes.length > 1) state.triedPairs.add(explodedTypes.join('+'));
  state.cauldron = {};
  state.cauldronEntryTime = {};

  log(`💥 Взрыв! ${totalUnits} ед. материи уничтожено`, 'fail');
  playExplode();

  const undiscovered = ELEMENT_IDS.filter(id => !state.discovered.has(id));
  const chaosChance = Math.max(0, 0.25 + totalUnits * 0.02 - (types - 1) * 0.05);
  if (undiscovered.length > 0 && Math.random() < chaosChance) {
    const picked = undiscovered[Math.floor(Math.random() * undiscovered.length)];
    state.discovered.add(picked);
    state.inventory[picked] = 2;
    log(`✨ Из хаоса родилось: ${ELEMENTS[picked].name}!`, 'discovery');
    UNLOCKABLE_STARTERS.forEach(s => {
      if (picked === s.unlockedBy && !state.discovered.has(s.id)) {
        state.discovered.add(s.id);
        state.inventory[s.id] = 9;
        log(`✦ Открыта новая стихия-врата: ${ELEMENTS[s.id].name}!`, 'discovery');
      }
    });
    state.stats.discoveryFromExplosion++;
    playDiscover();
    startDiscoveryAnimation(picked);
    state.stats.explosionCount++;
    checkAchievements();
    return;
  }

  state.stats.explosionCount++;
  checkAchievements();
  updateUI();
  state.animating = false;
  animData = null;
}

function finishDiscovery() {
  updateUI();
  state.animating = false;
  animData = null;
}

export function findMatchingRecipe(cauldron) {
  const candidates = RECIPES.filter(recipe => {
    for (const inp of recipe.inputs) {
      if (!cauldron[inp.id] || cauldron[inp.id] < inp.a) return false;
    }
    return true;
  });

  if (candidates.length === 0) return null;

  const ratioCandidates = candidates.filter(r => r.ratio);
  const normalCandidates = candidates.filter(r => !r.ratio);

  for (const recipe of ratioCandidates) {
    const { id, min, max } = recipe.ratio;
    const otherId = recipe.inputs.find(i => i.id !== id).id;
    if (cauldron[otherId] === 0) continue;
    const ratio = cauldron[id] / cauldron[otherId];
    if (ratio >= min && ratio <= max) return recipe;
  }

  normalCandidates.sort((a, b) => {
    const sumA = a.inputs.reduce((s, i) => s + i.a, 0);
    const sumB = b.inputs.reduce((s, i) => s + i.a, 0);
    return sumB - sumA;
  });

  return normalCandidates[0] || null;
}

function getDominantElement(cauldron) {
  let maxAmt = 0;
  let dominant = null;
  for (const [id, amt] of Object.entries(cauldron)) {
    if (amt > maxAmt) { maxAmt = amt; dominant = id; }
  }
  return dominant;
}

export function performMix() {
  const entries = Object.entries(state.cauldron);
  const totalTypes = entries.length;
  const totalUnits = entries.reduce((s, [,v]) => s + v, 0);

  if (totalUnits < 2) {
    log('⚠ Нужно минимум 2 единицы элементов в котле!', 'fail');
    shakeTimer = 6;
    shakeIntensity = 2;
    return;
  }

  if (totalTypes === 1) {
    const [id, qty] = entries[0];
    const name = ELEMENTS[id]?.name || id;
    log(`⚠ Концентрация ${name} ×${qty} — нестабильно!`, 'fail');
  }

  const recipe = findMatchingRecipe(state.cauldron);

  if (recipe) {
    const dominant = getDominantElement(state.cauldron);
    startMixAnimation(recipe, dominant);
  } else {
    startExplosionAnimation();
  }
}

export function gameLoop(timestamp) {
  time = timestamp || 0;
  if (Math.random() < 0.1) spawnAmbientParticles();
  drawScene();
  requestAnimationFrame(gameLoop);
}
