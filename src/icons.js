import { ELEMENTS, ELEMENT_IDS, STARTER_IDS, VARIANTS } from './data.js';

export const SIZE = 22;

export function isLightColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 180;
}

export function lightenColor(hex, percent) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * percent / 100));
  const lg = Math.min(255, Math.round(g + (255 - g) * percent / 100));
  const lb = Math.min(255, Math.round(b + (255 - b) * percent / 100));
  return `#${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')}`;
}

export const GLYPH_PATHS = {
  dot:     { d: 'M10,10 m-3.5,0 a3.5,3.5 0 1,0 7,0 a3.5,3.5 0 1,0 -7,0', fill: true },
  cross:   { d: 'M6,6 L14,14 M14,6 L6,14' },
  ring:    { d: 'M10,10 m-4.5,0 a4.5,4.5 0 1,0 9,0 a4.5,4.5 0 1,0 -9,0' },
  slash:   { d: 'M5,5 L15,15' },
  backslsh:{ d: 'M15,5 L5,15' },
  xmark:   { d: 'M4,4 L16,16 M16,4 L4,16' },
  tee:     { d: 'M5,10 L15,10 M10,5 L10,15' },
  chevron: { d: 'M4,13 L10,7 L16,13' },
  vee:     { d: 'M4,7 L10,13 L16,7' },
  bar:     { d: 'M4,10 L16,10' },
  pipe:    { d: 'M10,4 L10,16' },
  starlet: { d: 'M10,6 L11.5,9.5 L15,9.5 L12.5,12 L13.5,16 L10,13.5 L6.5,16 L7.5,12 L5,9.5 L9.5,9.5 Z', fill: true },
  diamond: { d: 'M10,5 L15,10 L10,15 L5,10 Z', fill: true },
  aster:   { d: 'M10,4 L10,16 M4,10 L16,10 M6,6 L14,14 M14,6 L6,14' },
  wave:    { d: 'M4,11 Q7,7 10,11 T16,11' },
  flame:   { d: 'M10,1 C12,4 14,7 14,11 C14,14 12,17 10,19 C9,17 7,15 7,13 C6,14 5,13 4,11 C4,8 6,5 8,4 C8.5,3 9,2 10,1 Z', fill: true },
  molten:  { d: 'M9,17 C5,12 4,8 6,5 C7,3 9.5,1 10,1 C10.5,1 13,3 14,5 C16,8 15,12 11,17 L10,19 Z', fill: true },
  sunray:  { d: 'M10,1 L10,3 M15,5 L13.5,6.5 M17,10 L15,10 M15,15 L13.5,13.5 M10,17 L10,15 M5,15 L6.5,13.5 M3,10 L5,10 M5,5 L6.5,6.5 M10,7 A3,3 0 1,1 10,13 A3,3 0 1,1 10,7 Z' },
  burst:   { d: 'M10,0 L11,8 L19,9 L11,10 L10,18 L9,10 L1,9 L9,8 Z', fill: true },
  droplet: { d: 'M10,1 C14,8 15,13 12.5,16.5 C11,18.5 9,18.5 7.5,16.5 C5,13 6,8 10,1 Z', fill: true },
  bolt:    { d: 'M12,2 L6,11 L11,11 L7,18 L16,8 L11,8 Z', fill: true },
  flask:   { d: 'M8,2 L8,8 C4,10 4,17 10,17 C16,17 16,10 12,8 L12,2 Z', useShapeFill: true },
  vial:    { d: 'M8,5 L8,15 A3,3 0 0,0 12,15 L12,5 Z', useShapeFill: true },
  flaskBubbly: { d: 'M8,2 L8,8 C4,10 4,17 10,17 C16,17 16,10 12,8 L12,2 Z M12,6 A1.5,1.5 0 1,0 15,6 A1.5,1.5 0 1,0 12,6', useShapeFill: true },
  heart:   { d: 'M10,15 C5,11 5,6 7,5 C10,4 10,8 10,8 C10,8 10,4 13,5 C15,6 15,11 10,15 Z', useShapeFill: true },


  comet:   { d: 'M14,2 C9,6 5,10 3,14 C8,12 12,8 14,2 Z', fill: true },


};

export const SHAPE_POLYGONS = {
  circle:   'M1,10 A9,9 0 1,0 19,10 A9,9 0 1,0 1,10 Z',
  diamond:  'M10,1 L19,10 L10,19 L1,10 Z',
  hexagon:  'M10,0.5 L18.5,5 L18.5,15 L10,19.5 L1.5,15 L1.5,5 Z',
  triangle: 'M10,1 L19,18 L1,18 Z',
  square:   'M1.5,1.5 L18.5,1.5 L18.5,18.5 L1.5,18.5 Z',
  star:     'M10,1 L12.5,7 L19,7 L14,11.5 L15.5,18.5 L10,14.5 L4.5,18.5 L6,11.5 L1,7 L7.5,7 Z',
};

export const ICON_DESIGNS = {
  // starter (circle)
  fire:     { shape: 'circle',   glyph: 'flame',   rot: 0 },
  water:    { shape: 'circle',   glyph: 'droplet', rot: 0 },
  earth:    { shape: 'circle',   glyph: 'diamond', rot: 0 },
  air:      { shape: 'circle',   glyph: 'ring',    rot: 0 },
  void:     { shape: 'circle',   glyph: 'dot',     rot: 0 },
  // state (triangle)
  steam:    { shape: 'triangle', glyph: 'wave',    rot: 0 },
  hotSteam: { shape: 'triangle', glyph: 'cross',   rot: 0 },
  wetSteam: { shape: 'triangle', glyph: 'droplet', rot: 0 },
  ice:      { shape: 'triangle', glyph: 'starlet', rot: 0 },
  mist:     { shape: 'triangle', glyph: 'ring',    rot: 0 },
  dust:     { shape: 'triangle', glyph: 'dot',     rot: 0 },
  ash:      { shape: 'triangle', glyph: 'dot',     rot: 45 },
  lava:     { shape: 'triangle', glyph: 'molten',  rot: 0 },
  magma:    { shape: 'triangle', glyph: 'molten',  rot: 180 },
  scoria:   { shape: 'triangle', glyph: 'diamond', rot: 45 },
  mud:      { shape: 'triangle', glyph: 'bar',     rot: 0 },
  sludge:   { shape: 'triangle', glyph: 'wave',    rot: 45 },
  storm:    { shape: 'triangle', glyph: 'aster',   rot: 0 },
  inferno:  { shape: 'triangle', glyph: 'flame',   rot: 45 },
  gale:     { shape: 'triangle', glyph: 'chevron', rot: 45 },
  thunder:  { shape: 'triangle', glyph: 'bolt',    rot: 45 },
  frost:    { shape: 'triangle', glyph: 'starlet', rot: 45 },
  bubble:   { shape: 'triangle', glyph: 'ring',    rot: 45 },
  echo:     { shape: 'triangle', glyph: 'ring',    rot: 90 },
  // nature (diamond)
  wood:     { shape: 'diamond',  glyph: 'pipe',    rot: 0 },
  forest:   { shape: 'diamond',  glyph: 'aster',   rot: 0 },
  flower:   { shape: 'diamond',  glyph: 'starlet', rot: 0 },
  life:     { shape: 'diamond',  glyph: 'heart',   rot: 0 },
  swamp:    { shape: 'diamond',  glyph: 'wave',    rot: 0 },
  poison:   { shape: 'diamond',  glyph: 'xmark',   rot: 0 },
  spring:   { shape: 'diamond',  glyph: 'droplet', rot: 0 },
  mountain: { shape: 'diamond',  glyph: 'chevron', rot: 0 },
  moss:     { shape: 'diamond',  glyph: 'dot',     rot: 0 },
  coral:    { shape: 'diamond',  glyph: 'starlet', rot: 45 },
  vine:     { shape: 'diamond',  glyph: 'wave',    rot: 45 },
  root:     { shape: 'diamond',  glyph: 'tee',     rot: 0 },
  mushroom: { shape: 'diamond',  glyph: 'vee',     rot: 0 },
  seed:     { shape: 'diamond',  glyph: 'dot',     rot: 45 },
  // metal (square)
  metal:    { shape: 'square',   glyph: 'slash',   rot: 0 },
  steel:    { shape: 'square',   glyph: 'cross',   rot: 0 },
  blade:    { shape: 'square',   glyph: 'slash',   rot: 45 },
  rust:     { shape: 'square',   glyph: 'xmark',   rot: 0 },
  stone:    { shape: 'square',   glyph: 'diamond', rot: 0 },
  crystal:  { shape: 'square',   glyph: 'starlet', rot: 0 },
  diamond:  { shape: 'square',   glyph: 'diamond', rot: 45 },
  gold:     { shape: 'square',   glyph: 'dot',     rot: 0 },
  silver:   { shape: 'square',   glyph: 'ring',    rot: 0 },
  iron:     { shape: 'square',   glyph: 'bar',     rot: 0 },
  // artifact (hexagon)
  glass:    { shape: 'hexagon',  glyph: 'ring',    rot: 0 },
  brick:    { shape: 'hexagon',  glyph: 'cross',   rot: 0 },
  ceramic:  { shape: 'hexagon',  glyph: 'diamond', rot: 0 },
  clay:     { shape: 'hexagon',  glyph: 'bar',     rot: 0 },
  crown:    { shape: 'hexagon',  glyph: 'starlet', rot: 0 },
  amulet:   { shape: 'hexagon',  glyph: 'ring',    rot: 45 },
  rune:     { shape: 'hexagon',  glyph: 'cross',   rot: 45 },
  prism:    { shape: 'hexagon',  glyph: 'aster',   rot: 0 },
  mirror:   { shape: 'hexagon',  glyph: 'ring',    rot: 90 },
  clockwork:{ shape: 'hexagon',  glyph: 'tee',     rot: 0 },
  scroll:   { shape: 'hexagon',  glyph: 'bar',     rot: 45 },
  lantern:  { shape: 'hexagon',  glyph: 'diamond', rot: 45 },
  key:      { shape: 'hexagon',  glyph: 'cross',   rot: 90 },
  shield:   { shape: 'hexagon',  glyph: 'tee',     rot: 45 },
  // magic (star)
  light:    { shape: 'star',     glyph: 'aster',   rot: 0 },
  shadow:   { shape: 'star',     glyph: 'xmark',   rot: 0 },
  essence:  { shape: 'star',     glyph: 'dot',     rot: 0 },
  ghost:    { shape: 'star',     glyph: 'ring',    rot: 0 },
  golem:    { shape: 'star',     glyph: 'diamond', rot: 0 },
  phoenix:  { shape: 'star',     glyph: 'flame',   rot: 0 },
  chimera:  { shape: 'star',     glyph: 'aster',   rot: 45 },
  abyss:    { shape: 'star',     glyph: 'dot',     rot: 45 },
  rift:     { shape: 'star',     glyph: 'xmark',   rot: 45 },
  mirage:   { shape: 'star',     glyph: 'ring',    rot: 45 },
  siren:    { shape: 'star',     glyph: 'wave',    rot: 0 },
  wand:     { shape: 'star',     glyph: 'pipe',    rot: 0 },
  curse:    { shape: 'star',     glyph: 'xmark',   rot: 90 },
  fairy:    { shape: 'star',     glyph: 'starlet', rot: 0 },
  phantom:  { shape: 'star',     glyph: 'ring',    rot: 90 },
  // cosmos (circle)
  ether:    { shape: 'circle',   glyph: 'aster',   rot: 0 },
  star:     { shape: 'circle',   glyph: 'starlet', rot: 0 },
  nova:     { shape: 'circle',   glyph: 'burst',   rot: 0 },
  meteor:   { shape: 'circle',   glyph: 'comet',   rot: 0 },
  eclipse:  { shape: 'circle',   glyph: 'dot',     rot: 90 },
  moon:     { shape: 'circle',   glyph: 'ring',    rot: 135 },
  sun:      { shape: 'circle',   glyph: 'sunray',  rot: 0 },
  galaxy:   { shape: 'circle',   glyph: 'wave',    rot: 90 },
  // alchemy (diamond)
  potion:   { shape: 'diamond',  glyph: 'flask',   rot: 0 },
  acid:     { shape: 'diamond',  glyph: 'flaskBubbly',   rot: 30 },
  pearl:    { shape: 'diamond',  glyph: 'dot',     rot: 90 },
  sand:     { shape: 'diamond',  glyph: 'dot',     rot: 135 },
  obsidian: { shape: 'diamond',  glyph: 'diamond', rot: 90 },
  fossil:   { shape: 'diamond',  glyph: 'cross',   rot: 90 },
  geyser:   { shape: 'diamond',  glyph: 'pipe',    rot: 0 },
  hurricane:{ shape: 'diamond',  glyph: 'wave',    rot: 135 },
  lightning:{ shape: 'diamond',  glyph: 'bolt',    rot: 0 },
  plasma:   { shape: 'diamond',  glyph: 'cross',   rot: 135 },
  death:    { shape: 'diamond',  glyph: 'xmark',   rot: 45 },
  amber:    { shape: 'diamond',  glyph: 'dot',     rot: 45 },
  elixir:   { shape: 'diamond',  glyph: 'vial',   rot: 0 },
  catalyst: { shape: 'diamond',  glyph: 'chevron', rot: 90 },
  salt:     { shape: 'diamond',  glyph: 'bar',     rot: 45 },
};

export const TIER = (() => {
  const t = {};
  ELEMENT_IDS.forEach(id => { t[id] = 'normal'; });
  STARTER_IDS.forEach(id => { t[id] = 'starter'; });
  ['inferno','spring','mountain','gale','rift'].forEach(id => { t[id] = 'self'; });
  VARIANTS.forEach(id => { t[id] = 'variant'; });
  t['chimera'] = 'legendary';
  return t;
})();

export function buildIconSVG(id, size) {
  const el = ELEMENTS[id];
  const design = ICON_DESIGNS[id];
  if (!design) return '';
  const { shape, glyph, rot } = design;
  const shapePath = SHAPE_POLYGONS[shape];
  const glyphData = GLYPH_PATHS[glyph];
  if (!shapePath || !glyphData) return '';
  const color = el.color;
  const s = size || SIZE;
  const rotAttr = rot ? ` transform="rotate(${rot} 10 10)"` : '';

  const lighter = lightenColor(color, 40);
  const gradId = `g-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const gradDef = `<radialGradient id="${gradId}" cx="35%" cy="35%"><stop offset="0%" stop-color="${lighter}" stop-opacity="0.95"/><stop offset="100%" stop-color="${color}" stop-opacity="0.95"/></radialGradient>`;

  const glyphColor = isLightColor(color) ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';

  if (glyphData.useShapeFill) {
    const glowEl = `<circle cx="10" cy="10" r="11" fill="${color}" opacity="0.08"/>`;
    const glyphEl = `<path d="${glyphData.d}" fill="url(#${gradId})" stroke="${glyphColor}" stroke-width="1.6"${rotAttr}/>`;
    return `<svg width="${s}" height="${s}" viewBox="0 0 20 20"><defs>${gradDef}</defs>${glowEl}${glyphEl}</svg>`;
  }

  const gradShape = `<radialGradient id="s-${gradId}" cx="35%" cy="35%"><stop offset="0%" stop-color="${lighter}" stop-opacity="0.85"/><stop offset="100%" stop-color="${color}" stop-opacity="0.85"/></radialGradient>`;
  const glowEl = `<circle cx="10" cy="10" r="11" fill="${color}" opacity="0.12"/>`;
  const shapeEl = shape === 'circle'
    ? `<circle cx="10" cy="10" r="9" fill="url(#s-${gradId})"/>`
    : `<path d="${shapePath}" fill="url(#s-${gradId})"/>`;
  const rimEl = shape === 'circle'
    ? `<circle cx="10" cy="10" r="7.7" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`
    : `<path d="${shapePath}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1" transform="translate(10,10) scale(0.86) translate(-10,-10)"/>`;
  const gFill = glyphData.fill ? glyphColor : 'none';
  const gStroke = glyphData.fill ? 'none' : glyphColor;
  const glyphEl = `<path d="${glyphData.d}" fill="${gFill}" stroke="${gStroke}" stroke-width="1.6"${rotAttr}/>`;

  return `<svg width="${s}" height="${s}" viewBox="0 0 20 20"><defs>${gradShape}</defs>${glowEl}${shapeEl}${rimEl}${glyphEl}</svg>`;
}

export function drawGlyph(ctx, id, x, y, scale, color, alpha) {
  const design = ICON_DESIGNS[id];
  if (!design) return;
  const glyphData = GLYPH_PATHS[design.glyph];
  if (!glyphData) return;
  const el = ELEMENTS[id];
  if (!el) return;
  const glyphColor = color || (isLightColor(el.color) ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)');
  const sc = scale || 1;
  ctx.save();
  if (alpha != null) ctx.globalAlpha *= alpha;
  ctx.shadowBlur = 0;
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  ctx.translate(-10, -10);
  if (design.rot) {
    ctx.translate(10, 10);
    ctx.rotate(design.rot * Math.PI / 180);
    ctx.translate(-10, -10);
  }
  const path = new Path2D(glyphData.d);
  if (glyphData.useShapeFill) {
    const grad = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, 10);
    grad.addColorStop(0, lightenColor(el.color, 40));
    grad.addColorStop(1, el.color);
    ctx.fillStyle = grad;
    ctx.fill(path);
    ctx.strokeStyle = glyphColor;
    ctx.lineWidth = 1.6;
    ctx.stroke(path);
  } else if (glyphData.fill) {
    ctx.fillStyle = glyphColor;
    ctx.fill(path);
  } else {
    ctx.strokeStyle = glyphColor;
    ctx.lineWidth = 1.6;
    ctx.stroke(path);
  }
  ctx.restore();
}
