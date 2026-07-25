import { ELEMENTS, ELEMENT_IDS, STARTER_IDS, VARIANTS } from './data.js';

export const SIZE = 22;

export function isLightColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 180;
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
  fire:     { shape: 'circle',   glyph: 'cross',   rot: 0 },
  water:    { shape: 'circle',   glyph: 'wave',    rot: 0 },
  earth:    { shape: 'circle',   glyph: 'diamond', rot: 0 },
  air:      { shape: 'circle',   glyph: 'ring',    rot: 0 },
  void:     { shape: 'circle',   glyph: 'dot',     rot: 0 },
  // state (triangle)
  steam:    { shape: 'triangle', glyph: 'wave',    rot: 0 },
  hotSteam: { shape: 'triangle', glyph: 'cross',   rot: 0 },
  wetSteam: { shape: 'triangle', glyph: 'vee',     rot: 0 },
  ice:      { shape: 'triangle', glyph: 'starlet', rot: 0 },
  mist:     { shape: 'triangle', glyph: 'ring',    rot: 0 },
  dust:     { shape: 'triangle', glyph: 'dot',     rot: 0 },
  ash:      { shape: 'triangle', glyph: 'dot',     rot: 45 },
  lava:     { shape: 'triangle', glyph: 'chevron', rot: 0 },
  magma:    { shape: 'triangle', glyph: 'diamond', rot: 0 },
  scoria:   { shape: 'triangle', glyph: 'diamond', rot: 45 },
  mud:      { shape: 'triangle', glyph: 'bar',     rot: 0 },
  sludge:   { shape: 'triangle', glyph: 'wave',    rot: 45 },
  storm:    { shape: 'triangle', glyph: 'aster',   rot: 0 },
  inferno:  { shape: 'triangle', glyph: 'cross',   rot: 45 },
  gale:     { shape: 'triangle', glyph: 'chevron', rot: 45 },
  thunder:  { shape: 'triangle', glyph: 'xmark',   rot: 0 },
  frost:    { shape: 'triangle', glyph: 'starlet', rot: 45 },
  bubble:   { shape: 'triangle', glyph: 'ring',    rot: 45 },
  echo:     { shape: 'triangle', glyph: 'ring',    rot: 90 },
  // nature (diamond)
  wood:     { shape: 'diamond',  glyph: 'pipe',    rot: 0 },
  forest:   { shape: 'diamond',  glyph: 'aster',   rot: 0 },
  flower:   { shape: 'diamond',  glyph: 'starlet', rot: 0 },
  life:     { shape: 'diamond',  glyph: 'cross',   rot: 0 },
  swamp:    { shape: 'diamond',  glyph: 'wave',    rot: 0 },
  poison:   { shape: 'diamond',  glyph: 'xmark',   rot: 0 },
  spring:   { shape: 'diamond',  glyph: 'diamond', rot: 0 },
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
  phoenix:  { shape: 'star',     glyph: 'chevron', rot: 0 },
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
  nova:     { shape: 'circle',   glyph: 'cross',   rot: 90 },
  meteor:   { shape: 'circle',   glyph: 'chevron', rot: 0 },
  eclipse:  { shape: 'circle',   glyph: 'dot',     rot: 90 },
  moon:     { shape: 'circle',   glyph: 'ring',    rot: 135 },
  sun:      { shape: 'circle',   glyph: 'aster',   rot: 45 },
  galaxy:   { shape: 'circle',   glyph: 'wave',    rot: 90 },
  // alchemy (diamond)
  potion:   { shape: 'diamond',  glyph: 'ring',    rot: 45 },
  acid:     { shape: 'diamond',  glyph: 'xmark',   rot: 90 },
  pearl:    { shape: 'diamond',  glyph: 'dot',     rot: 90 },
  sand:     { shape: 'diamond',  glyph: 'dot',     rot: 135 },
  obsidian: { shape: 'diamond',  glyph: 'diamond', rot: 90 },
  fossil:   { shape: 'diamond',  glyph: 'cross',   rot: 90 },
  geyser:   { shape: 'diamond',  glyph: 'pipe',    rot: 0 },
  hurricane:{ shape: 'diamond',  glyph: 'wave',    rot: 135 },
  lightning:{ shape: 'diamond',  glyph: 'aster',   rot: 0 },
  plasma:   { shape: 'diamond',  glyph: 'cross',   rot: 135 },
  death:    { shape: 'diamond',  glyph: 'xmark',   rot: 45 },
  amber:    { shape: 'diamond',  glyph: 'dot',     rot: 45 },
  elixir:   { shape: 'diamond',  glyph: 'ring',    rot: 135 },
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
  let shapeEl;
  if (shape === 'circle') {
    shapeEl = `<circle cx="10" cy="10" r="9" fill="${color}" opacity="0.85"/>`;
  } else {
    shapeEl = `<path d="${shapePath}" fill="${color}" opacity="0.85"/>`;
  }
  const glyphColor = isLightColor(color) ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
  const gFill = glyphData.fill ? glyphColor : 'none';
  const gStroke = glyphData.fill ? 'none' : glyphColor;
  const glyphEl = `<path d="${glyphData.d}" fill="${gFill}" stroke="${gStroke}" stroke-width="1.6"${rotAttr}/>`;
  return `<svg width="${s}" height="${s}" viewBox="0 0 20 20">${shapeEl}${glyphEl}</svg>`;
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
  if (glyphData.fill) {
    ctx.fillStyle = glyphColor;
    ctx.fill(path);
  } else {
    ctx.strokeStyle = glyphColor;
    ctx.lineWidth = 1.6;
    ctx.stroke(path);
  }
  ctx.restore();
}
