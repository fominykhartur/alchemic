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

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function rgbToHex(r, g, b) {
  const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function hexToHsl(hex) {
  let [r, g, b] = hexToRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return rgbToHex(r * 255, g * 255, b * 255);
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

const textSafeCache = new Map();

export function textSafeColor(hex, bg = '#0d0d20', minContrast = 4.5) {
  const key = `${hex}|${bg}|${minContrast}`;
  if (textSafeCache.has(key)) return textSafeCache.get(key);
  let { h, s, l } = hexToHsl(hex);
  while (contrastRatio(hslToHex(h, s, l), bg) < minContrast && l < 95) l += 3;
  const safe = hslToHex(h, s, l);
  textSafeCache.set(key, safe);
  return safe;
}

export const GLYPH_PATHS = {
  dot:     { d: 'M10,10 m-3.5,0 a3.5,3.5 0 1,0 7,0 a3.5,3.5 0 1,0 -7,0', fill: true },
  cross:   { d: 'M6,6 L14,14 M14,6 L6,14' },
  ring:    { d: 'M10,10 m-4.5,0 a4.5,4.5 0 1,0 9,0 a4.5,4.5 0 1,0 -9,0' },
  slash:   { d: 'M5,5 L15,15' },
  backslsh:{ d: 'M15,5 L5,15' },
  xmark:   { d: 'M4,4 L16,16 M16,4 L4,16' },
  tee:     { d: 'M5,10 L15,10 M10,5 L10,15', round: true },
  chevron: { d: 'M4,13 L10,7 L16,13' },
  vee:     { d: 'M4,7 L10,13 L16,7' },
  bar:     { d: 'M4,10 L16,10' },
  pipe:    { d: 'M10,4 L10,16' },
  starlet: { d: 'M10,6 L11.5,9.5 L15,9.5 L12.5,12 L13.5,16 L10,13.5 L6.5,16 L7.5,12 L5,9.5 L9.5,9.5 Z', fill: true },
  diamond: { d: 'M10,5 L15,10 L10,15 L5,10 Z', fill: true },
  aster:   { d: 'M10,4 L10,16 M4,10 L16,10 M6,6 L14,14 M14,6 L6,14' },
  wave:    { d: 'M4,11 Q7,7 10,11 T16,11' },
  flame:   { d: 'M5,12 C5,15 7,17 10,17 C13,17 15,15 15,12 L14,7 L12,10 L10,3 L8,10 L6,7 Z', fill: true },
  molten:  { d: 'M9,17 C5,12 4,8 6,5 C7,3 9.5,1 10,1 C10.5,1 13,3 14,5 C16,8 15,12 11,17 L10,19 Z', fill: true },
  sunray:  { d: 'M10,3 L10,5 M15,5 L13.5,6.5 M17,10 L15,10 M15,15 L13.5,13.5 M10,17 L10,15 M5,15 L6.5,13.5 M3,10 L5,10 M5,5 L6.5,6.5 M10,7 A3,3 0 1,1 10,13 A3,3 0 1,1 10,7 Z', round: true },
  burst:   { d: 'M10,0 L11,8 L19,9 L11,10 L10,18 L9,10 L1,9 L9,8 Z', fill: true },
  droplet: { d: 'M10,1 C14,8 15,13 12.5,16.5 C11,18.5 9,18.5 7.5,16.5 C5,13 6,8 10,1 Z', fill: true },
  bolt:    { d: 'M12,2 L6,11 L11,11 L7,18 L16,8 L11,8 Z', useShapeFill: true },
  flask:   { d: 'M8,2 L8,8 C4,10 4,17 10,17 C16,17 16,10 12,8 L12,2 Z', useShapeFill: true },
  vial:    { d: 'M8,5 L8,15 A3,3 0 0,0 12,15 L12,5 Z', useShapeFill: true },
  flaskBubbly: { d: 'M8,2 L8,8 C4,10 4,17 10,17 C16,17 16,10 12,8 L12,2 Z M12,6 A1.5,1.5 0 1,0 15,6 A1.5,1.5 0 1,0 12,6', useShapeFill: true },
  heart:   { d: 'M10,15 C5,11 5,6 7,5 C10,4 10,8 10,8 C10,8 10,4 13,5 C15,6 15,11 10,15 Z', useShapeFill: true, round: true },
  skull:   { d: 'M4,10 C4,2 16,2 16,10 C16,14 14,16 13,16 L12,18 L11,16 L10,18 L9,16 L8,18 L7,16 C6,16 4,14 4,10 Z M5.2,8 A1.8,1.8 0 1,0 8.8,8 A1.8,1.8 0 1,0 5.2,8 M11.2,8 A1.8,1.8 0 1,0 14.8,8 A1.8,1.8 0 1,0 11.2,8 M10,10 L11,12 L9,12 Z', useShapeFill: true, round: true },
  gear:    { d: 'M15.909,8.958 L17.878,8.611 A8,8 0 0,1 17.878,11.389 L15.909,11.042 A6,6 0 0,1 14.915,13.441 L16.553,14.588 A8,8 0 0,1 14.588,16.553 L13.441,14.915 A6,6 0 0,1 11.042,15.909 L11.389,17.878 A8,8 0 0,1 8.611,17.878 L8.958,15.909 A6,6 0 0,1 6.559,14.915 L5.412,16.553 A8,8 0 0,1 3.447,14.588 L5.085,13.441 A6,6 0 0,1 4.091,11.042 L2.122,11.389 A8,8 0 0,1 2.122,8.611 L4.091,8.958 A6,6 0 0,1 5.085,6.559 L3.447,5.412 A8,8 0 0,1 5.412,3.447 L6.559,5.085 A6,6 0 0,1 8.958,4.091 L8.611,2.122 A8,8 0 0,1 11.389,2.122 L11.042,4.091 A6,6 0 0,1 13.441,5.085 L14.588,3.447 A8,8 0 0,1 16.553,5.412 L14.915,6.559 A6,6 0 0,1 15.909,8.958 Z M7.5,10 A2.5,2.5 0 1,0 12.5,10 A2.5,2.5 0 1,0 7.5,10', useShapeFill: true, round: true },
  feather: { d: 'M10,2 C15,3 16,10 10,18 C9,17 8,13 8,11 L10,10 L8,8 C8,7 7,6 7,5 L9,4 L7,3 C7,2 8,2 10,2 Z', useShapeFill: true },
  seed:    { d: 'M10,3 C14,7 14,15 10,17 C6,15 6,7 10,3 Z', useShapeFill: true },
  teardrop:{ d: 'M7,15 C7,18 13,18 13,15 L10,3 Z', fill: true },
  waves:   { d: 'M4,7 Q7,3 10,7 T16,7 M4,10 Q7,6 10,10 T16,10 M4,13 Q7,9 10,13 T16,13', round: true },
  mountains:{ d: 'M4,14 L6,7 L9,14 Z M7,14 L10,3 L13,14 Z M11,14 L14,7 L16,14 Z', fill: true },
  breezsym:  { d: 'M8,15 Q6,10 5,6 M10,15 Q10,9 10,4 M12,15 Q14,10 15,6' },
  airsym:  { d: 'M8,3.8 A1.7,1.7 0 1,1 9.2,6.7 H1.7 M14.8,6.4 A2.1,2.1 0 1,1 16.3,10 H1.7 M10.5,16.2 A1.7,1.7 0 1,0 11.7,13.3 H1.7', round: true },
  phoenixGlyph:{ d: 'M10,2 L11,4 L14,3 L13,6 L16,5 L14,8 L17,9 L14,11 L15,15 L12,14 L10,17 L8,14 L5,15 L6,11 L3,9 L6,8 L4,5 L7,6 L6,3 L9,4 Z', useShapeFill: true },
  iceCube: { d: 'M10,4 L16,8 L10,12 L4,8 Z M16,8 L16,14 L10,18 L10,12 Z M10,12 L10,18 L4,14 L4,8 Z', useShapeFill: true, round: true },
  vapor:   { d: 'M7,16 C4,16 3,12 5,10 C3,8 4,5 7,5 C8,3 12,3 13,5 C16,5 17,8 15,10 C17,12 16,16 13,16 Z', useShapeFill: true },
  vaporHot:{ d: 'M7,16 C4,16 3,11 5,9 C3,6 4,3 8,4 C10,2 13,2 15,4 C18,4 17,7 15,9 C17,12 16,16 13,16 Z', useShapeFill: true },
  vaporCold:{ d: 'M6,16 C4,16 3,13 5,11 L5,8 L7,6 C8,3 12,3 13,6 C16,6 17,10 15,12 C17,14 16,16 13,16 Z', useShapeFill: true },
  volcano: { d: 'M4,18 L7,6 L8,6 L8,4 L12,4 L12,6 L13,6 L16,18 Z M10,4 L9,2 M10,4 L11,1 M10,4 L7,1 M10,4 L13,2', useShapeFill: true },
  volcanoFire:{ d: 'M4,18 L7,6 L8,6 L8,3 L9,1 L10,3 L11,1 L12,3 L12,6 L13,6 L16,18 Z', useShapeFill: true },
  fog:     { d: 'M2,13 C2,10 5,9 7,10 C8,8 11,8 12,10 C14,9 17,10 18,13 C19,15 17,17 15,16 C13,18 7,18 5,16 C3,17 1,15 2,13 Z', useShapeFill: true },
  splat:   { d: 'M6,15 C3,15 2,12 4,10 C2,8 4,5 7,6 C9,3 14,4 14,7 C17,7 18,11 16,13 C17,15 15,17 12,16 C11,18 8,18 6,15 Z', useShapeFill: true },
  swirl:   { d: 'M5,15 C2,11 3,7 6,6 C5,4 7,2 10,3 C13,2 16,4 15,7 C18,9 17,14 14,15 C13,17 10,18 9,16 C6,18 4,16 5,15 Z', useShapeFill: true },
  particles:{ d: 'M7,5 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 M12,12 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0 M5,12 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0 M14,6 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0', useShapeFill: true },
  ember:   { d: 'M3,15 Q10,7 17,15 Z', useShapeFill: true, round: true },
  cyclone: { d: 'M4,8 C3,5 5,3 8,4 C10,2 14,2 15,5 C17,4 19,6 18,9 C19,11 17,13 14,12 C12,14 8,14 6,12 C4,13 2,11 4,8 Z M10,13 L7,16 L10,16 L7,19 L14,15 L10,15 Z', useShapeFill: true, round: true },
  gust:    { d: 'M10,3 C14,4 16,8 14,12 C12,16 8,16 6,12 C5,10 5,8 7,6 M10,13 L8,15 L10,15 L9,17', useShapeFill: true, round: true },
  thunderBolt:{ d: 'M4,11 A2.8,2.8 0 0,1 6.3,5.8 A3.6,3.6 0 0,1 13.5,5.3 A2.6,2.6 0 0,1 16,9.5 A2.2,2.2 0 0,1 14.3,13.5 L5.5,13.5 A2,2 0 0,1 4,11 Z M6.5,16.2 A3,3 0 0,0 13.5,16.2 M4,18.4 A6,6 0 0,0 16,18.4', useShapeFill: true, round: true },
  infernal:{ d: 'M10,3 L11,6 L14,4 L13,7 L16,6 L14,10 C14,14 16,17 13,18 C12,19 10,20 10,20 C10,20 8,19 7,18 C4,17 6,14 6,10 L4,6 L7,7 L6,4 L9,6 Z', useShapeFill: true },
  cinder:  { d: 'M5,16 L3,10 L6,7 L5,4 L9,5 L12,3 L15,6 L17,10 L15,15 L12,18 L8,17 Z M7,10 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0 M12,9 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0', useShapeFill: true },
  dendrite:{ d: 'M10,1 L18,15 L2,15 Z M10,19 L18,5 L2,5 Z', useShapeFill: true },
  bubble:  { d: 'M10,2 A8,8 0 1,1 10,18 A8,8 0 1,1 10,2', useShapeFill: true },
  echoWaves:{ d: 'M13,18 L18,6 L18,18 Z M3,8 Q7,5 11,8 M3,11 Q7,8 11,11', useShapeFill: true, round: true },
  skullDrop:{ d: 'M10,2 C14,8 14,14 12,16 C11,17 9,17 8,16 C6,14 6,8 10,2 Z M8.5,10 m-1,0 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M11.5,10 m-1,0 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M10,12 L9.5,13 L10.5,13 Z M14,6 m-0.8,0 a0.8,0.8 0 1,1 1.6,0 a0.8,0.8 0 1,1 -1.6,0 M4,11 m-0.8,0 a0.8,0.8 0 1,1 1.6,0 a0.8,0.8 0 1,1 -1.6,0', fill: true },
  log:     { d: 'M2,10 A8,8 0 1,1 18,10 A8,8 0 1,1 2,10 M6,10 A4,4 0 1,0 14,10 A4,4 0 1,0 6,10 M9,3 L9.5,3 L9.5,7 L9,7 Z M10,17 L10.5,17 L10.5,13 L10,13 Z', fill: true },
  trunk:   { d: 'M8,3 L12,3 L12,14 L8,14 Z M8,13 L6,17 M12,13 L14,17 M9,6 L11,6 M9,9 L11,9', useShapeFill: true },
  trees:   { d: 'M2,18 L5,8 L8,18 Z M7,18 L11,5 L15,18 Z M12,18 L16,9 L19,18 Z', useShapeFill: true, round: true },
  swampReeds:{ d: 'M2,15 Q10,17 18,15 L18,18 L2,18 Z M5,15 L5.5,15 L5.5,8 L5,8 Z M4.5,6 A0.8,1.2 0 1,1 5.5,6 A0.8,1.2 0 1,1 4.5,6 M15,15 L15.5,15 L15.5,7 L15,7 Z M14.5,5 A0.8,1.2 0 1,1 15.5,5 A0.8,1.2 0 1,1 14.5,5 M10,4 a0.6,0.6 0 1,1 1.2,0 a0.6,0.6 0 1,1 -1.2,0 M6,10 a0.4,0.4 0 1,1 0.8,0 a0.4,0.4 0 1,1 -0.8,0 M14,10 a0.4,0.4 0 1,1 0.8,0 a0.4,0.4 0 1,1 -0.8,0', fill: true },
  peak:    { d: 'M2,18 L6,9 L9,14 L13,4 L19,18 Z M9,14 L13,4 L13,8 M6,9 L6,12', useShapeFill: true, round: true },
  clump:   { d: 'M2,15 C2,12 5,11 7,12 C9,10 11,10 13,12 C15,11 18,12 18,15 Z', useShapeFill: true, round: true },
  coralBranch:{ d: 'M2,17 Q10,19 18,17 L18,18 L2,18 Z M7.5,18 L8.5,18 L8.5,12 L7.5,12 Z M8,14.5 L11.5,10 L12,9.5 L8.5,14 Z M7.5,13 L4,10 L4.5,9.5 L8,13.5 Z M7.5,12 L11,7 L11.5,7.5 L8.5,12 Z M14,8 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0 M4,7 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0 M6,5 a0.4,0.4 0 1,1 0.8,0 a0.4,0.4 0 1,1 -0.8,0 M13,14 a0.4,0.4 0 1,1 0.8,0 a0.4,0.4 0 1,1 -0.8,0', fill: true },
  tendril: { d: 'M9,18 Q6,13 11,10 Q14,7 9,5 L10.5,5 Q15.5,8 12,11 Q7,14 10,18 Z M6.5,14 a1,1.5 0 1,1 2,0 a1,1.5 0 1,1 -2,0 M12,10.5 a1,1.5 0 1,1 2,0 a1,1.5 0 1,1 -2,0 M8.5,7 a0.8,1.2 0 1,1 1.6,0 a0.8,1.2 0 1,1 -1.6,0', fill: true },
  taproot: { d: 'M9,3 L11,3 L11,5 L9,5 Z M9.5,5 Q7,9 9.5,12 L10.5,12 Q8,9 10.5,5 Z M10.5,12 Q13,14 14,16.5 L13.5,16.5 Q12.5,14 10,12 Z M8.5,9 Q6,10.5 5,13 L5.5,13 Q6.5,10.5 9,9 Z M10,3 L9.5,1.5 L10.5,1.5 Z', fill: true },
  fungus:  { d: 'M6,11 C6,6 8,4 10,4 C12,4 14,6 14,11 Z M9.5,17 L10.5,17 L10.5,11 L9.5,11 Z M8,17 L6.5,15 L7,17 Z M12,17 L13.5,15 L13,17 Z M7,8.5 a0.8,0.8 0 1,0 1.6,0 a0.8,0.8 0 1,0 -1.6,0 M12.5,8 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0 M5,16 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0', fill: true },
  flowerBloom:{ d: 'M10,2 C9,4 6,5 6,8 C6,10 8,11 10,11 C12,11 14,10 14,8 C14,5 11,4 10,2 Z M9.5,11 L9.5,17 L10.5,17 L10.5,11 Z M8,13 L6,14 L7,16 Z M12,14 L14,15 L13,17 Z M4,8 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0 M16,9 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0', fill: true },
  springFountain:{ d: 'M5,18 L10,10 L15,18 Z M10,2 C12,6 13,9 11,11 C10.5,12 9.5,12 9,11 C7,9 8,6 10,2 Z M7,13 L5,11 L6,13 Z M14,9 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0 M6,9 a0.4,0.4 0 1,1 0.8,0 a0.4,0.4 0 1,1 -0.8,0 M13,16 a0.4,0.4 0 1,1 0.8,0 a0.4,0.4 0 1,1 -0.8,0', fill: true },
  // metal
  cog:     { d: 'M9,5 L11,5 L11,6 L12,6 L12,7 L14,7 L14,9 L15,9 L15,11 L14,11 L14,13 L12,13 L12,14 L11,14 L11,15 L9,15 L9,14 L8,14 L8,13 L6,13 L6,11 L5,11 L5,9 L6,9 L6,7 L8,7 L8,6 L9,6 Z M9,10 a1.5,1.5 0 1,0 2,0 a1.5,1.5 0 1,0 -2,0 M7,8 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0 M13,8 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0', fill: true },
  // gems
  roughgem: { d: 'M10,2 L12,5 L14,5 L16,9 L13,14 L11,14 L10,17 L9,14 L7,14 L4,9 L6,5 L8,5 Z M9.5,8 a0.5,0.5 0 1,0 1,0 a0.5,0.5 0 1,0 -1,0 M11.5,10 a0.4,0.4 0 1,0 0.8,0 a0.4,0.4 0 1,0 -0.8,0 M8,12 a0.4,0.4 0 1,1 0.8,0 a0.4,0.4 0 1,1 -0.8,0 M12,8 a0.3,0.3 0 1,1 0.6,0 a0.3,0.3 0 1,1 -0.6,0', useShapeFill: true },
  gemfacets:{ d: 'M10,2 L12,5 L14,5 L16,9 L13,14 L11,14 L10,17 L9,14 L7,14 L4,9 L6,5 L8,5 Z M10,2 L10,17 M4,9 L16,9 M12,5 L10,8 M8,5 L10,8 M11,14 L10,12 M9,14 L10,12', useShapeFill: true },
  gemdia:  { d: 'M10,2 L12,5 L14,5 L16,9 L13,14 L11,14 L10,17 L9,14 L7,14 L4,9 L6,5 L8,5 Z M10,2 L10,17 M4,9 L16,9 M12,5 L10,8 M8,5 L10,8 M11,14 L10,12 M9,14 L10,12 M6,7 L7,7 M6.5,6.5 L6.5,7.5 M13,11 L14,11 M13.5,10.5 L13.5,11.5', useShapeFill: true },

  ingot:   { d: 'M6,5 L14,5 A2,2 0 0,1 16,7 L16,13 A2,2 0 0,1 14,15 L6,15 A2,2 0 0,1 4,13 L4,7 A2,2 0 0,1 6,5 Z', useShapeFill: true },
  ingotRust:{ d: 'M6,5 L14,5 A2,2 0 0,1 16,7 L16,13 A2,2 0 0,1 14,15 L6,15 A2,2 0 0,1 4,13 L4,7 A2,2 0 0,1 6,5 Z M9,9 a0.8,0.8 0 1,0 1.6,0 a0.8,0.8 0 1,0 -1.6,0 M11.5,11 a0.5,0.5 0 1,0 1,0 a0.5,0.5 0 1,0 -1,0 M7,11.5 a0.4,0.4 0 1,0 0.8,0 a0.4,0.4 0 1,0 -0.8,0 M9,12 L10.5,13 M12,8.5 L11,10 M13.5,9 L12.5,10.5', useShapeFill: true },
  ingotIron:{ d: 'M6,5 L14,5 A2,2 0 0,1 16,7 L16,13 A2,2 0 0,1 14,15 L6,15 A2,2 0 0,1 4,13 L4,7 A2,2 0 0,1 6,5 Z M9,9 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0 M12,12 a0.4,0.4 0 1,1 0.8,0 a0.4,0.4 0 1,1 -0.8,0 M7,11 a0.4,0.4 0 1,1 0.8,0 a0.4,0.4 0 1,1 -0.8,0', useShapeFill: true },
  sword:   { d: 'M10,2 L13,11 L7,11 Z M6,12 L14,12 L14,13 L6,13 Z M9.5,13 L10.5,13 L10.5,17 L9.5,17 Z M9,17 L11,17 L10.5,18 L9.5,18 Z M10,3 L10,11 M10,1 L10,1.8 M9.6,1.4 L10.4,1.4', useShapeFill: true },
  coin:    { d: 'M5,10 a5,5 0 1,1 10,0 a5,5 0 1,1 -10,0 M8.5,10 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0 M5,7 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0 M15,10 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0 M10,4 a0.4,0.4 0 1,1 0.8,0 a0.4,0.4 0 1,1 -0.8,0', fill: true },
  lunar:   { d: 'M7,6 L13,6 L15,10 L13,14 L7,14 L5,10 Z M10,8 C11.5,8 12.5,9 11.5,10 C11,10.5 10,10.5 9.5,10 C9,9.5 9,8.5 10,8 Z M12,11 a0.4,0.4 0 1,1 0.8,0 a0.4,0.4 0 1,1 -0.8,0 M8,7 a0.4,0.4 0 1,1 0.8,0 a0.4,0.4 0 1,1 -0.8,0', fill: true },
  // earth
  clayblob:{ d: 'M6,6 L14,6 Q15,6 15,7 L15,13 Q15,14 14,14 L6,14 Q5,14 5,13 L5,7 Q5,6 6,6 Z M9,9 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0 M11.5,11 a0.5,0.5 0 1,0 1,0 a0.5,0.5 0 1,0 -1,0', useShapeFill: true },
  brickblk:{ d: 'M5,6 L15,6 L15,14 L5,14 Z M7,8 L7,10 L9,10 L9,8 Z M11,8 L11,10 L13,10 L13,8 Z M8,11 L8,13 L12,13 L12,11 Z', useShapeFill: true },
  ceramicblk:{ d: 'M5,6 L15,6 L15,14 L5,14 Z M6,7 L14,7', useShapeFill: true },
  // transparent
  glasspn: { d: 'M10,4 L16,10 L10,16 L4,10 Z M6,8 L8,6 M14,8 L12,6 M10,11 L10,13', useShapeFill: true },
  prismshp:{ d: 'M10,3 L17,15 L3,15 Z M10,3 L10,15 M6,10 L14,10', useShapeFill: true },
  mirrorpn:{ d: 'M6,5 L14,5 A1,1 0 0,1 15,6 L15,14 A1,1 0 0,1 14,15 L6,15 A1,1 0 0,1 5,14 L5,6 A1,1 0 0,1 6,5 Z M7,7 L13,7 M7,8 L7,9', useShapeFill: true, round: true },
  // artifacts
  crownsym:{ d: 'M3,9 L4.5,13 L6.5,9 L8.5,13 L10.5,9 L12.5,13 L14.5,9 L16,13 L17.5,9 L17.5,14 L3,14 Z M6,12.5 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0 M10,12.5 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0 M14,12.5 a0.5,0.5 0 1,1 1,0 a0.5,0.5 0 1,1 -1,0', useShapeFill: true, solidFill: true },
  runesym: { d: 'M4,7 L16,7 L14,15 L6,15 Z M10,8 L10,13 M8,10 L12,10', useShapeFill: true, round: true },
  amuletsym:{ d: 'M5,10 a5,5 0 1,1 10,0 a5,5 0 1,1 -10,0 M8,10 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0 M10,5 L10,3', useShapeFill: true },
  scrollsym:{ d: 'M6,5 L14,5 Q15,5 15,6 L15,14 Q15,15 14,15 L6,15 Q5,15 5,14 L5,6 Q5,5 6,5 Z M6,8 L14,8 M6,11 L14,11', useShapeFill: true },
  lantrnsym:{ d: 'M7,4 L13,4 L13,5 L14,5 L14,14 L13,14 L13,16 L7,16 L7,14 L6,14 L6,5 L7,5 Z M8,6 L12,6 L12,13 L8,13 Z M10,4 L10,3', useShapeFill: true },
  keysym:  { d: 'M8,9 L8,16 L12,16 L12,9 Z M10,6 a3,3 0 1,1 6,0 a3,3 0 1,1 -6,0 M12,11 L14,11 M12,13 L15,13 M12,15 L14,15', useShapeFill: true },
  // magic & energy
  lightsym: { d: 'M10,3 L12,9 L18,10 L12,11 L10,17 L8,11 L2,10 L8,9 Z', useShapeFill: true },
  shadowsym:{ d: 'M4,10 C4,7 6,5 9,6 C10,4 13,4 14,6 C16,5 18,7 17,10 C18,13 16,16 14,15 C13,17 10,17 9,15 C6,16 4,14 4,10 Z', useShapeFill: true },
  sigil:    { d: 'M10,2.5 A7.5,7.5 0 1,1 10,17.5 A7.5,7.5 0 1,1 10,2.5 M10,5.5 A4.5,4.5 0 1,0 10,14.5 A4.5,4.5 0 1,0 10,5.5 M10,7.5 L13.5,13 L6.5,13 Z', useShapeFill: true, round: true },
  essencesym:{ d: 'M10,2 L15,15 A5,5 0 0,1 5,15 Z M10,11 a2,2 0 1,1 4,0 a2,2 0 1,1 -4,0', useShapeFill: true },
  ghostsym:{ d: 'M5,14 L5,8 C5,4 15,4 15,8 L15,14 L14,14 L13,12 L12,14 L11,12 L10,14 L9,12 L8,14 L7,12 L6,14 Z', useShapeFill: true },
  golemsym:{ d: 'M5,5 L15,5 L15,11 L17,14 L14,18 L6,18 L3,14 L5,11 Z M9,9 a1.5,1.5 0 1,1 3,0 a1.5,1.5 0 1,1 -3,0', useShapeFill: true },
  abysssym:{ d: 'M4,10 L6,6 L10,4 L14,6 L16,10 L14,14 L10,16 L6,14 Z M10,8 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0', useShapeFill: true },
  chimerasym:{ d: 'M5,10 C5,6 15,6 15,10 C15,14 5,14 5,10 Z M7,8 a1.5,1.5 0 1,1 3,0 a1.5,1.5 0 1,1 -3,0 M12,7 a1.5,1.5 0 1,1 3,0 a1.5,1.5 0 1,1 -3,0', useShapeFill: true },
  riftsym:{ d: 'M8,3 L11,8 L7,9 L10,12 L6,14 L13,12 L15,17 L12,15 L14,12 L10,13 L8,10 L12,8 Z', useShapeFill: true },
  miragesym:{ d: 'M4,7 Q8,4 12,7 T18,7 L18,10 Q14,7 10,10 T4,10 Z M4,11 Q8,8 12,11 T18,11 L18,14 Q14,11 10,14 T4,14 Z', useShapeFill: true },
  sirensym:{ d: 'M3,11 Q7,7 11,11 Q15,15 19,11 L19,14 Q15,18 11,14 Q7,10 3,14 Z M10,9 a1.5,1.5 0 1,1 3,0 a1.5,1.5 0 1,1 -3,0 M11.5,5 L14,5 L14,9 L12.5,9 L12.5,6.5 L11.5,6.5 Z', fill: true },
  wandsym:{ d: 'M9,4 L11,4 L11,15 L9,15 Z M8,15 L12,15 L12,18 L8,18 Z M10,2 L12,6 L10,8 L8,6 Z', useShapeFill: true },
  cursesym:{ d: 'M6,6 L10,4 L14,6 L14,11 L10,16 L6,11 Z M10,8 a0.8,0.8 0 1,1 1.6,0 a0.8,0.8 0 1,1 -1.6,0 M10,11 L10,13', useShapeFill: true },
  fairysym:{ d: 'M10,10 L13,16 L7,16 Z M10,8 L8,10 L6,5 Z M10,8 L14,5 L12,10 Z', fill: true },
  phantomsym:{ d: 'M5,11 L5,7 C5,4 15,4 15,7 L15,11 L17,14 L16,18 L14,16 L12,18 L10,16 L8,18 L6,16 L4,18 L3,14 Z', useShapeFill: true },
  // cosmos
  voidsym: { d: 'M10,1.5 A6.8,6.8 0 0,1 15.1,10 A4.08,4.08 0 0,1 10,13.06 A2.45,2.45 0 0,1 8.16,10 A1.47,1.47 0 0,1 10,8.9 A0.88,0.88 0 0,1 10.66,10', round: true },
  ethersym:{ d: 'M10,2 C15,4 16,8 14,11 C12,14 8,15 6,13 C4,11 4,7 7,5 C10,3 12,6 11,9 C10,12 7,11 7,9', useShapeFill: true, round: true },
  starsym:{ d: 'M10,1 L12.5,7.5 L19,7.5 L14,12 L15.5,19 L10,15 L4.5,19 L6,12 L1,7.5 L7.5,7.5 Z', useShapeFill: true },
  novasym:{ d: 'M10,2 L11,7 L16,5 L13,9 L19,10 L13,11 L16,15 L11,13 L10,18 L9,13 L4,15 L7,11 L1,10 L7,9 L4,5 L9,7 Z', useShapeFill: true },
  meteorsym:{ d: 'M14,2 L17,1 L19,4 L17,8 L13,9 L11,6 Z M12,5 L5,12 L2,9 Z M13,7 L7,15 L4,12 Z M14,4 L9,11 L6,9 Z', useShapeFill: true },
  eclipsesym:{ d: 'M4,10 A6,6 0 1,1 16,10 A6,6 0 1,1 4,10', useShapeFill: true },
  moonsym:{ d: 'M10,3 A7,7 0 1,1 10,17 A7,7 0 1,1 10,3 M7,4.8 A1.2,1.2 0 1,1 7,7.2 A1.2,1.2 0 1,1 7,4.8 M11.5,7 A1,1 0 0,0 13.5,7 M13.5,9.4 A0.6,0.6 0 1,1 13.5,10.6 A0.6,0.6 0 1,1 13.5,9.4 M7.2,10 A1.3,1.3 0 0,1 9.8,10 M11,11.2 A0.8,0.8 0 1,1 11,12.8 A0.8,0.8 0 1,1 11,11.2 M6.3,13 A0.7,0.7 0 0,0 7.7,13 M14.5,8.2 A0.3,0.3 0 1,1 14.5,8.8 A0.3,0.3 0 1,1 14.5,8.2 M8.5,10.5 A0.5,0.5 0 0,1 9.5,10.5 M5,9.1 A0.4,0.4 0 1,1 5,9.9 A0.4,0.4 0 1,1 5,9.1', useShapeFill: true, round: true },
  galaxysym:{ d: 'M10,5 a1.5,1.5 0 1,1 3,0 a1.5,1.5 0 1,1 -3,0 M13,8 a1,1 0 1,1 2,0 a1,1 0 1,1 -2,0 M14.5,12 a1,1 0 1,1 2,0 a1,1 0 1,1 -2,0 M11.5,15 a1,1 0 1,1 2,0 a1,1 0 1,1 -2,0 M7,14 a1,1 0 1,1 2,0 a1,1 0 1,1 -2,0 M4.5,10 a1,1 0 1,1 2,0 a1,1 0 1,1 -2,0 M6.5,7 a1,1 0 1,1 2,0 a1,1 0 1,1 -2,0 M15,9 a0.5,0.5 0 1,1 1,0 M5,9 a0.5,0.5 0 1,1 1,0 M10,11 a0.5,0.5 0 1,1 1,0', fill: true },


  comet:   { d: 'M14,2 C9,6 5,10 3,14 C8,12 12,8 14,2 Z', fill: true },

  // energy & elements
  lightningsym:{ d: 'M12,2 L8,9 L11,9 L5,17 L9,9 L7,8 Z M15,4 L12,7 M4,13 L1,15 M9.5,9.5 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0', useShapeFill: true },
  plasmasym:{ d: 'M6,14 C3,11 4,6 8,5 C10,2 15,3 16,7 C19,10 17,15 13,15 C12,18 8,17 6,14 Z M14,4 L17,2 M17,8 L19,6 M13,15 L15,18 M4,10 L2,12', useShapeFill: true, round: true },
  geysersym:{ d: 'M5,18 L5,8 C5,6 7,6 7,8 L7,18 Z M11,18 L11,5 C11,3 13,3 13,5 L13,18 Z M17,18 L17,10 C17,8 19,8 19,10 L19,18 Z M5,5 a0.8,0.8 0 1,0 1.6,0 a0.8,0.8 0 1,0 -1.6,0 M11,2 a0.5,0.5 0 1,0 1,0 a0.5,0.5 0 1,0 -1,0 M17,7 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0', useShapeFill: true },
  hurricanSym:{ d: 'M10,2 C16,3 18,8 15,13 C12,18 6,17 5,12 C4,7 8,3 13,5 C17,7 17,13 12,15 C8,17 5,13 7,10 C9,7 12,9 11,12 C10,14 8,13 9,11 L10,10 Z', useShapeFill: true },
  // earth & minerals
  sandsym: { d: 'M5,8 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0 M12,5 a1.2,1.2 0 1,0 2.4,0 a1.2,1.2 0 1,0 -2.4,0 M8,14 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M15,12 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0 M5,11 a0.7,0.7 0 1,0 1.4,0 a0.7,0.7 0 1,0 -1.4,0 M13,8 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0 M10,10 a0.5,0.5 0 1,0 1,0 a0.5,0.5 0 1,0 -1,0', fill: true },
  pearlsym:{ d: 'M10,3 A7,7 0 1,1 10,17 A7,7 0 1,1 10,3 M7,7 A1,1 0 1,0 9,7 A1,1 0 1,0 7,7', useShapeFill: true },
  obsidiansym:{ d: 'M4,16 L10,2 L16,16 Z M8,17 L11,6 L14,17 Z M12,18 L14,9 L16,18 Z', useShapeFill: true },
  fossilsym:{ d: 'M10,2 C16,2 18,8 15,13 C12,18 5,16 4,10 C3,5 7,3 10,5 C13,7 14,12 10,14 C7,16 5,12 7,9 C9,7 11,9 10,11 C9,12 8,11 9,10 L10,10 Z', useShapeFill: true },
  ambersym:{ d: 'M10,3 C10,3 16,8 16,13 C16,17 13,19 10,19 C7,19 4,17 4,13 C4,8 10,3 10,3 Z M10,11 a0.8,0.8 0 1,0 1.6,0 a0.8,0.8 0 1,0 -1.6,0', useShapeFill: true },
  saltsym: { d: 'M10,3 L17,7 L17,15 L10,19 L3,15 L3,7 Z M10,3 L10,19 M3,7 L17,15 M17,7 L3,15', useShapeFill: true },
  catalystsym:{ d: 'M10,2 L16,6 L16,14 L10,18 L4,14 L4,6 Z M10,6 L13,8 L13,12 L10,14 L7,12 L7,8 Z M10,10 a0.5,0.5 0 1,0 1,0 a0.5,0.5 0 1,0 -1,0', useShapeFill: true },
  // Tria Prima
  rawSulfurSym:  { d: 'M10,2 L18,16 L2,16 Z M5,12 L15,12', useShapeFill: true, round: true },
  rawMercurySym: { d: 'M10,3 A6,6 0 1,1 10,15 A6,6 0 1,1 10,3 M7,3.5 L10,0.5 L13,3.5 M10,15 L10,20 M7.5,18 L12.5,18', useShapeFill: true, round: true },
  saltPhilSym:   { d: 'M10,3 A7,7 0 1,1 10,17 A7,7 0 1,1 10,3 M4,10 L16,10', useShapeFill: true, round: true },
  // Magnum Opus
  nigredoSym:    { d: 'M10,16 L17,3 L3,3 Z', useShapeFill: true, round: true },
  albedoSym:     { d: 'M10,4 A6,6 0 1,1 10,16 A6,6 0 1,1 10,4 M10,2 L10,4 M6,5 L5,3.5 M14,5 L15,3.5', useShapeFill: true, round: true },
  citrinitasSym: { d: 'M10,3 A6,6 0 1,1 10,15 A6,6 0 1,1 10,3 M10,1 L10,3 M10,15 L10,17 M4,9 L2,9 M16,9 L18,9 M6,5.5 L5,4.5 M14,5.5 L15,4.5 M6,12.5 L5,13.5 M14,12.5 L15,13.5', useShapeFill: true, round: true },
  rubedoSym:     { d: 'M10,2 A6,6 0 1,1 10,14 A6,6 0 1,1 10,2 M10,0 L10,2 M10,14 L10,16 M3.5,9 L2,9 M16.5,9 L18,9 M5.5,5 L4.5,4 M14.5,5 L15.5,4 M5.5,11 L4.5,12 M14.5,11 L15.5,12', useShapeFill: true, round: true },
  // Rebis
  rexSym:        { d: 'M4,16 L5,6 L8,12 L10,4 L12,12 L15,6 L16,16 Z', useShapeFill: true, round: true },
  reginaSym:     { d: 'M12,3 A7,7 0 1,1 7,16 A5,5 0 1,0 12,3 Z M4,5 L5,6.5 L7,7 L5.5,7.5 L5,9 L4.5,7.5 L3,7 L4.5,6.5 Z', useShapeFill: true, round: true },
  rebisSym:      { d: 'M7,10 C7,4 13,4 13,10 C13,16 7,16 7,10', useShapeFill: true, round: true },
  // Athanor
  athanorSym:    { d: 'M7,4 L7,16 L13,16 L13,4 Z M10,2 L10,4 M8.5,7 L11.5,7 M8.5,10 L11.5,10 M8.5,13 L11.5,13', useShapeFill: true, round: true },
  eggSym:        { d: 'M10,2 C16,2 18,9 10,18 C2,9 4,2 10,2 Z', useShapeFill: true, round: true },
  // Solve et Coagula
  azothSym:      { d: 'M10,2 L18,14 L2,14 Z M10,18 L2,6 L18,6 Z', useShapeFill: true, round: true },
  solveSym:      { d: 'M10,3 L18,17 L2,17 Z', useShapeFill: true, round: true },
  coagulaSym:    { d: 'M10,17 L18,3 L2,3 Z', useShapeFill: true, round: true },
  alkahestSym:   { d: 'M10,2 L18,16 L2,16 Z M6,12 L14,12', useShapeFill: true, round: true },
  // Микрокосм
  vesselSym:     { d: 'M5,7 L5,16 L15,16 L15,7 C15,3 5,3 5,7 Z M8,2 L12,2 M10,2 L10,5', useShapeFill: true, round: true },
  homunculusSym: { d: 'M10,4 a3,3 0 1,1 6,0 a3,3 0 1,1 -6,0 M7,10 L13,10 L13,16 L7,16 Z', useShapeFill: true, round: true },
  adeptSym:      { d: 'M10,1 L14,5 L18,5 L15,9 L18,13 L14,13 L10,17 L6,13 L2,13 L5,9 L2,5 L6,5 Z', useShapeFill: true, round: true },
  // Эликсиры
  aurumPotabileSym:{ d: 'M8,7.5 L8,16.5 A3,3 0 0,0 12,16.5 L12,7.5 Z M7.3,5.5 L12.7,5.5 L12.7,7.5 L7.3,7.5 Z M10,2.2 L10.5,3.3 L11.6,3.8 L10.5,4.3 L10,5.4 L9.5,4.3 L8.4,3.8 L9.5,3.3 Z', strokePath: 'M8.3,12 L11.7,12', useShapeFill: true, round: true },
  elixirVitaeSym:{ d: 'M8,7 L8,15 A3,3 0 0,0 12,15 L12,7 Z M10,7 C10,7 8.3,4.8 9.3,3.3 C10.3,4.5 10,6.5 10,7 Z M10,7 C10,7 11.7,4.8 10.7,3.3 C9.7,4.5 10,6.5 10,7 Z', strokePath: 'M8.3,11 L9.2,11 L9.7,9.5 L10.3,12.5 L10.8,11 L11.7,11', useShapeFill: true, round: true },
  panaceaSym:    { d: 'M10,3 A7,7 0 1,1 10,17 A7,7 0 1,1 10,3 M10,6 L10,14 M6,10 L14,10', useShapeFill: true, round: true },
  ambrosiaSym:   { d: 'M4,4 L4,7 C4,10 7,11 10,11 C13,11 16,10 16,7 L16,4 Z M9,11 L11,11 L11,15 L9,15 Z M6.5,15 L13.5,15 L13.5,16.5 L6.5,16.5 Z M10,1 C11,2.5 10.7,4 10,4 C9.3,4 9,2.5 10,1 Z M6.5,2.5 C7.2,3.5 7,4.5 6.5,4.5 C6,4.5 5.8,3.5 6.5,2.5 Z M13.5,2.5 C14.2,3.5 14,4.5 13.5,4.5 C13,4.5 12.8,3.5 13.5,2.5 Z', useShapeFill: true, round: true },
  // Макрокосм
  macrocosmSym:  { d: 'M10,2 A8,8 0 1,1 10,18 A8,8 0 1,1 10,2 M10,5 A5,5 0 1,1 10,15 A5,5 0 1,1 10,5 M10,10 a1.5,1.5 0 1,1 3,0', useShapeFill: true, round: true },
  hermeticSym:   { d: 'M4,4 L16,4 L16,16 L4,16 Z M10,6 A4,4 0 1,1 10,14 A4,4 0 1,1 10,6', useShapeFill: true, round: true },
  animaMundiSym: { d: 'M10,2 A8,8 0 1,1 10,18 A8,8 0 1,1 10,2 M10,5 A5,5 0 1,1 10,15 A5,5 0 1,1 10,5 M10,10 a1.5,1.5 0 1,1 3,0 a1.5,1.5 0 1,1 -3,0 M10,0 L10,2 M10,18 L10,20 M2,10 L0,10 M18,10 L20,10', useShapeFill: true, round: true },
  // Мутация
  basiliskSym:   { d: 'M3,16 C6,4 14,4 17,16 C13,18 7,18 3,16 Z M11,8 a1,1 0 1,1 2,0 a1,1 0 1,1 -2,0', useShapeFill: true, round: true },
  wyvernSym:     { d: 'M2,16 L6,4 L10,10 L14,4 L18,16 L14,10 L10,14 L6,10 Z', useShapeFill: true, round: true },
  leviathanSym:  { d: 'M2,12 C6,6 14,6 18,12 C14,16 6,16 2,12 Z M18,12 L20,10 M18,12 L20,14', useShapeFill: true, round: true },
  // Поглощение
  voidRiftSym:   { d: 'M5,3 L9,9 L7,12 L11,14 L8,19 M15,4 L12,9 L14,12 L11,14 L13,18', useShapeFill: true, round: true },
  blackHoleSym:  { d: 'M10,2 A8,8 0 1,1 10,18 A8,8 0 1,1 10,2 M10,6 A4,4 0 1,0 10,14 A4,4 0 1,0 10,6', useShapeFill: true, round: true },
  singularitySym:{ d: 'M10,3 A7,7 0 1,1 10,17 A7,7 0 1,1 10,3 M10,10 L10,2 M10,10 L10,18 M10,10 L2,10 M10,10 L18,10 M10,10 L5,5 M10,10 L15,15 M10,10 L15,5 M10,10 L5,15 M10,10 a1.5,1.5 0 1,1 3,0', useShapeFill: true, round: true },
  // Иллюзия
  illusionSym:   { d: 'M4,10 C4,4 16,4 16,10 C16,16 4,16 4,10 Z M7,8 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0 M11,11 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0 M8,13 L12,13', useShapeFill: true, round: true },
  tricksterSym:  { d: 'M10,3 L16,8 L14,14 L10,17 L6,14 L4,8 Z M7,9 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M12,9 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M8,12 L12,12', useShapeFill: true, round: true },
  nemesisSym:    { d: 'M10,4 L10,7 M3,7 L17,7 M3,7 L7,16 M17,7 L13,16 M7,16 L13,16', useShapeFill: true, round: true },
  // Время
  timepieceSym:  { d: 'M10,3 A7,7 0 1,1 10,17 A7,7 0 1,1 10,3 M10,10 L10,6 M10,10 L14,10 M10,10 a1,1 0 1,1 2,0', useShapeFill: true, round: true },
  chronomancerSym:{ d: 'M10,1.8 A3.6,3.6 0 1,1 10,9 A3.6,3.6 0 1,1 10,1.8 M9.1,9 L9.1,18 L10.9,18 L10.9,9 Z', strokePath: 'M10,5.4 L10,3 M10,5.4 L12.5,6.2 M10,5.4 a0.7,0.7 0 1,0 1.4,0 a0.7,0.7 0 1,0 -1.4,0', useShapeFill: true, round: true },
  paradoxSym:    { d: 'M10,3 A7,7 0 1,1 10,17 A7,7 0 1,1 10,3 M6.5,10 Q8.5,8.8 10,10 Q11.5,11.2 13.5,10', strokePath: 'M7.5,8 L3.5,8 M3.5,8 L5.5,6.5 M3.5,8 L5.5,9.5 M12.5,12 L16.5,12 M16.5,12 L14.5,10.5 M16.5,12 L14.5,13.5', useShapeFill: true, round: true },
  // Разложение
  sporeSym:      { d: 'M10,3 A7,7 0 1,1 10,17 A7,7 0 1,1 10,3 M8,7 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M12,11 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M7,13 a0.8,0.8 0 1,0 1.6,0 a0.8,0.8 0 1,0 -1.6,0 M13,8 a0.8,0.8 0 1,0 1.6,0 a0.8,0.8 0 1,0 -1.6,0', useShapeFill: true, round: true },
  plagueSym:     { d: 'M10,4 L12,9 L17,9 L13,12 L14,17 L10,14 L6,17 L7,12 L3,9 L8,9 Z', useShapeFill: true, round: true },
  parasiteSym:   { d: 'M4,8 C4,2 16,2 16,8 C16,14 10,16 10,16 C10,16 4,14 4,8 Z M8,7 a0.8,0.8 0 1,0 1.6,0 M13,5 L15,3', useShapeFill: true, round: true },
  // Катализ
  ignitionSym:   { d: 'M10,2 C13,6 14,9 12,12 C13,10 11,9 11,11 C11,13 9,13 9,11 C9,9 7,10 8,12 C6,9 7,6 10,2 Z M10,14.3 L10.5,15.5 L11.7,16 L10.5,16.5 L10,17.7 L9.5,16.5 L8.3,16 L9.5,15.5 Z', strokePath: 'M10,12.3 L10,14', useShapeFill: true, round: true },
  engineSym:     { d: 'M5,5 L15,5 L15,15 L5,15 Z M8,5 L8,15 M12,5 L12,15 M9,8 L11,8 M9,12 L11,12', useShapeFill: true, round: true },
  auroraSym:     { d: 'M2,8 Q6,4 10,8 T18,8 M2,12 Q6,8 10,12 T18,12 M2,16 Q6,12 10,16 T18,16', useShapeFill: true, round: true },
  // Кросс-комбо
  sovereignSym:  { d: 'M4,12 L6,3 L10,7 L14,3 L16,12 L16,15 L14,17 L10,14 L6,17 L4,15 Z', useShapeFill: true, round: true },
  oneirographSym:{ d: 'M10,3 a7,7 0 1,1 0,14 a7,7 0 1,1 0,-14 M7,2 L7,0 M13,2 L13,0 M7,18 L7,20 M13,18 L13,20 M2,7 L0,7 M2,13 L0,13 M18,7 L20,7 M18,13 L20,13 M10,8 a1.5,1.5 0 1,0 0,3 a1.5,1.5 0 1,0 0,-3', useShapeFill: true, round: true },
  apocalypseSym: { d: 'M8,3 L12,3 L12,8 L17,8 L17,12 L12,12 L12,17 L8,17 L8,12 L3,12 L3,8 L8,8 Z M10,0 L10,3 M10,17 L10,20 M0,10 L3,10 M17,10 L20,10 M5,3 L7,5 M15,3 L13,5 M5,17 L7,15 M15,17 L13,15 M3,5 L5,7 M17,5 L15,7 M3,15 L5,13 M17,15 L15,13', useShapeFill: true, round: true },
  // Врата
  spiritSym:    { d: 'M10,3 a3.5,3.5 0 1,1 7,0 a3.5,3.5 0 1,1 -7,0 M10,6 C8,10 5,12 4,16 M10,6 C12,10 15,12 16,16', useShapeFill: true, round: true },
  matterSym:    { d: 'M10,2 L18,6 L10,10 L2,6 Z M2,6 L2,14 L10,18 L10,10 M18,6 L18,14 L10,18', useShapeFill: true, round: true },
  timeSym:      { d: 'M6,3 L14,3 L10,10 L14,17 L6,17 L10,10 Z', useShapeFill: true, round: true },
  spaceSym:     { d: 'M3,7 L3,3 L7,3 M13,3 L17,3 L17,7 M3,13 L3,17 L7,17 M17,13 L17,17 L13,17 M6.4,7 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0 M12.5,8 a0.5,0.5 0 1,0 1,0 a0.5,0.5 0 1,0 -1,0 M8.3,13 a0.7,0.7 0 1,0 1.4,0 a0.7,0.7 0 1,0 -1.4,0', round: true },
  chaosSym:     { d: 'M10,2 L13,8 L19,5 L14,11 L19,16 L12,14 L10,19 L8,14 L1,16 L6,11 L1,5 L7,8 Z', useShapeFill: true, round: true },
  entropySym:   { d: 'M10,3 C15,3 17,8 14,11 C11,14 6,12 7,9 C8,6 12,7 12,9 L12,16', useShapeFill: true, round: true },
  // Ветка Духа и Материи
  transcendenceSym:{ d: 'M10,1 L16,8 L13,8 L13,17 L7,17 L7,8 L4,8 Z', useShapeFill: true, round: true },
  titanSym:        { d: 'M2,18 L5,10 L8,15 L12,3 L16,15 L18,18 Z M8,15 L12,3 L14,12 M5,10 L5,14', useShapeFill: true, round: true },
  greatBindingSym: { d: 'M7,3 A6,6 0 1,1 7,15 A6,6 0 1,1 7,3 M13,5 A6,6 0 1,1 13,17 A6,6 0 1,1 13,5 M10,9 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0', useShapeFill: true, round: true },
  anchorSym:       { d: 'M7,11 L13,11 L13,15 L7,15 Z M10,4 L10,11 M8,4 L12,4 M5,14 L7,14 L7,17 L5,17 Z M13,14 L15,14 L15,17 L13,17 Z', useShapeFill: true, round: true },
  // Уникальные иконки: буря/природа/материя (ревизия дубликатов)
  maelstromSym:    { d: 'M17,10 A7,7 0 1,0 8.5,16.8 A5,5 0 1,1 14.5,9 A3,3 0 1,0 8,11.5', useShapeFill: true, round: true },
  tempestSym:      { d: 'M10,2 L7.5,9 L11,9 L8,18 M14,3.5 L15.5,9.5 L18.5,9 L15,16 M2,9.5 L6,10 L3.5,15.5', useShapeFill: true, round: true },
  ancientGroveSym: { d: 'M10,2 C6.5,2 4.5,5.5 5.5,8.5 C3,9.5 2.5,13 5,14.5 L8,13 L8,18 L12,18 L12,13 L15,14.5 C17.5,13 17,9.5 14.5,8.5 C15.5,5.5 13.5,2 10,2 Z M6,18 L4,20.5 M14,18 L16,20.5', useShapeFill: true, round: true },
  treantSym:       { d: 'M10,3 C6.5,3 5,6.5 6.5,9 C4.5,10 4.5,13.5 7.5,13.5 L7.5,18 L12.5,18 L12.5,13.5 C15.5,13.5 15.5,10 13.5,9 C15,6.5 13.5,3 10,3 Z', strokePath: 'M8,8 a0.9,0.9 0 1,0 1.8,0 M10.2,8 a0.9,0.9 0 1,0 1.8,0 M8,11 Q10,12.5 12,11', useShapeFill: true, round: true },
  worldTreeSym:    { d: 'M10,10 L10,17 M10,10 L10,3 M10,5.5 L6,2.5 M10,5.5 L14,2.5 M10,8 L5.5,6 M10,8 L14.5,6 M10,13 L6.5,16 M10,13 L13.5,16 M10,15.5 L6,17.5 M10,15.5 L14,17.5', round: true },
  eternalBlightSym:{ d: 'M10,10 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0', strokePath: 'M10,3 L10,7 M10,13 L10,17 M3,10 L7,10 M13,10 L17,10 M5,5 L7.5,7.5 M12.5,12.5 L15,15 M15,5 L12.5,7.5 M7.5,12.5 L5,15', useShapeFill: true, round: true },
  decaySym:        { d: 'M10,10 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0', strokePath: 'M6,4 L9,9 L5,12 M14,5 L11,9 L15,13 M8,15 L10,11 L13,16', useShapeFill: true, round: true },
  livingShieldSym: { d: 'M10,2 L17,5 L17,10 C17,15 13,18 10,19 C7,18 3,15 3,10 L3,5 Z', strokePath: 'M10,6 C8,9 8,13 10,16 C12,13 12,9 10,6 Z M10,9 L7.5,11 M10,9 L12.5,11 M10,12.5 L8,14 M10,12.5 L12,14', useShapeFill: true, round: true },
  whisperingWindsSym:{ d: 'M3,7 Q6.5,3 10,7 Q13.5,3 17,7 M2.5,11.5 Q7,8.5 10,11.5 Q13,8.5 17.5,11.5 M4,16 Q8,14 10,16 Q12,14 16,16', round: true },
  massSym:         { d: 'M10,10 m-4.5,0 a4.5,4.5 0 1,0 9,0 a4.5,4.5 0 1,0 -9,0', strokePath: 'M10,1.5 L10,4 M10,16 L10,18.5 M1.5,10 L4,10 M16,10 L18.5,10', useShapeFill: true, round: true },
  densitySym:      { d: 'M6,6 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M13,6 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M6,14 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M13,14 a1.1,1.1 0 1,0 2.2,0 a1.1,1.1 0 1,0 -2.2,0 M8.8,10 a1.2,1.2 0 1,0 2.4,0 a1.2,1.2 0 1,0 -2.4,0', strokePath: 'M2.5,2.5 L17.5,2.5 L17.5,17.5 L2.5,17.5 Z', useShapeFill: true, round: true },
  ruinSym:         { d: 'M6,18 L6,8 L8,8 L8,18 Z M12,18 L12,5 L14,5 L14,18 Z', strokePath: 'M4,18 L16,18 M12,5 L9,3 M9,3 L11,3', useShapeFill: true, round: true },
  bedrockSym:      { d: 'M3,16 L17,16 L17,18 L3,18 Z M4,12 L16,12 L16,15 L4,15 Z M3,8 L17,8 L17,11 L3,11 Z M5,4 L15,4 L15,7 L5,7 Z', useShapeFill: true, round: true },
  chaosStormSym:   { d: 'M10,2 C15,2 18,6 16,10 C19,12 17,17 12,16 C13,19 8,19 7,16 C2,17 1,12 4,10 C1,7 4,3 8,4 C7,1 12,1 10,4 Z', strokePath: 'M10,7 L12,10 L9,12 L11,14', useShapeFill: true, round: true },
  erosionSym:      { d: 'M4,17 L4,10 L7,6 L9,10 L11,5 L13,10 L16,7 L16,17 Z', strokePath: 'M3,13 Q6,11.5 9,13 Q12,14.5 17,12.5', useShapeFill: true, round: true },
  sproutSym:       { d: 'M10,18 L10,11 C10,11 6,10 6,7 C9,7 10,9 10,9 C10,9 11,6 14,6 C14,9 11,10 10,11', useShapeFill: true, round: true },
  virulentSwarmSym:{ d: 'M6,6 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M13,5 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M15,11 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M11,15 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M5,13 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M10,9 a1.3,1.3 0 1,0 2.6,0 a1.3,1.3 0 1,0 -2.6,0', fill: true, round: true },
  substanceSym:    { d: 'M10,2 C14,2 17,5 16,9 C19,11 17,16 13,16 C12,19 7,19 6,16 C2,15 2,10 5,8 C4,4 7,2 10,2 Z', useShapeFill: true, round: true },
  // Уникальные иконки: механизмы/артефакты/финал (ревизия дубликатов, партия 2)
  pistonEngineSym: { d: 'M10,2 L11,4 L9,4 Z M10,18 L11,16 L9,16 Z M2,10 L4,9 L4,11 Z M18,10 L16,9 L16,11 Z M10,10 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0', strokePath: 'M10,6 L10,14', useShapeFill: true, round: true },
  plasmaEnergySym: { d: 'M10,2 L11,13 L10,17 L9,13 Z M8,13 L12,13 L11,16 L9,16 Z', strokePath: 'M6,5 L8,7 L6,9 M14,5 L12,7 L14,9 M6,11 L7.5,12 M14,11 L12.5,12', useShapeFill: true, round: true },
  monolithSym:     { d: 'M7,18 L7,4 L13,4 L13,18 Z', strokePath: 'M8,7 L12,7 M8,11 L12,11 M9,3 L9,1 M11,3 L11,1', useShapeFill: true, round: true },
  ironWillSym:     { d: 'M10,2 L16,5 L16,10 C16,15 13,18 10,19 C7,18 4,15 4,10 L4,5 Z', strokePath: 'M10,2 L10,19 M6,7 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M12,7 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M6,13 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M12,13 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0', useShapeFill: true, round: true },
  forgeHeartSym:   { d: 'M10,17 C5,13 4,9 6,6.5 C8,4.5 10,7 10,7 C10,7 12,4.5 14,6.5 C16,9 15,13 10,17 Z', strokePath: 'M10,7 C9,9 8,11 10,13 C12,11 11,9 10,7 Z', useShapeFill: true, round: true },
  absoluteMassSym: { d: 'M10,10 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0', strokePath: 'M10,0.5 L10,3.5 M10,16.5 L10,19.5 M0.5,10 L3.5,10 M16.5,10 L19.5,10 M3,3 L5.2,5.2 M14.8,14.8 L17,17 M17,3 L14.8,5.2 M5.2,14.8 L3,17', useShapeFill: true, round: true },
  possessedArmorSym:{ d: 'M5,5 L10,2 L15,5 L15,9 L13,9 L13,13 L10,19 L7,13 L7,9 L5,9 Z', strokePath: 'M9,8 a0.9,0.9 0 1,0 1.8,0 M11.2,8 a0.9,0.9 0 1,0 1.8,0', useShapeFill: true, round: true },
  worldAnvilSym:   { d: 'M3,14 L17,14 L17,16 L3,16 Z M6,14 L6,10 L11,10 L14,7 L14,10 L11,12 L11,14 Z', strokePath: 'M15,4 L17,2 M16,5 L18,4 M14,6 L16,5', useShapeFill: true, round: true },
  // Уникальные иконки: стражи/нежить/бестиарий (ревизия дубликатов, партия 3)
  fatebreakerSym:  { d: 'M2,5 Q7,3 9,7 Q10,9 8,10 M8,7 L11,4 M8,10 L5,13 M12,10 L15,7 M12,10 L9,13 M12,10 Q13,12 18,15', round: true },
  guardianSym:     { d: 'M10,2 C6,2 3,6 3,10 C3,15 7,18 10,19 C13,18 17,15 17,10 C17,6 14,2 10,2 Z', strokePath: 'M6,9 Q10,6 14,9 Q10,12 6,9 Z M10,9 a1,1 0 1,0 0.1,0', useShapeFill: true, round: true },
  sentinelSym:     { d: 'M9,18 L9,8 L11,8 L11,18 Z', strokePath: 'M6,8 L10,3 L14,8 Z M10,3 a1.2,1.2 0 1,0 0.1,0', useShapeFill: true, round: true },
  choirOfSorrowSym:{ d: 'M4,10 C4,6 7,4 7,7 C7,9 5,9 5,11 M10,12 C10,7 13,5 13,8 C13,10 11,10 11,12 M16,9 C16,6 18,5 18,7 C18,8.5 17,8.5 17,10', round: true },
  deathlessWardenSym:{ d: 'M10,2 L16,5 L16,10 C16,15 13,18 10,19 C7,18 4,15 4,10 L4,5 Z', strokePath: 'M6,10 C6,8 8,8 10,10 C12,12 14,12 14,10 C14,8 12,8 10,10 C8,12 6,12 6,10 Z', useShapeFill: true, round: true },
  wraithLordSym:   { d: 'M5,10 C5,4 15,4 15,10 C15,13 13,15 12,15 L11,17 L10,15 L9,17 L8,15 C7,15 5,13 5,10 Z', strokePath: 'M6,4 L6,2 M8,4 L8,1 M10,4 L10,0.5 M12,4 L12,1 M14,4 L14,2 M6.5,9 a1,1 0 1,0 2,0 M11.5,9 a1,1 0 1,0 2,0', useShapeFill: true, round: true },
  chaosBeastSym:   { d: 'M10,17 C6,17 4,14 5,10 C3,9 3,5 6,4 C6,6 8,6 8,4 C9,3 11,3 12,4 C12,6 14,6 14,4 C17,5 17,9 15,10 C16,14 14,17 10,17 Z', strokePath: 'M7,10 a1,1 0 1,0 2,0 M11,10 a1,1 0 1,0 2,0 M8,13 L12,13', useShapeFill: true, round: true },
  voidSpawnSym:    { d: 'M10,3 C13,3 15,6 14,9 C16,10 16,14 13,15 C13,17 7,17 7,15 C4,14 4,10 6,9 C5,6 7,3 10,3 Z', strokePath: 'M7.5,9 a1,1 0 1,0 2,0 M10.5,9 a1,1 0 1,0 2,0', useShapeFill: true, round: true },
  deathKnightSym:  { d: 'M6,9 C6,4 14,4 14,9 C14,12 12,13 10,13 C8,13 6,12 6,9 Z', strokePath: 'M10,2 L10,4 M4,13 L16,7 M4,7 L16,13 M7,9 a0.8,0.8 0 1,0 1.6,0 M11.4,9 a0.8,0.8 0 1,0 1.6,0', useShapeFill: true, round: true },
  // Уникальные иконки: время/судьба (ревизия дубликатов, партия 4)
  chronosphereSym: { d: 'M10,10 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0', strokePath: 'M10,10 Q12,10 11.8,8.2 Q11.5,6.5 10,6.5 Q7.8,6.5 7.8,10 Q7.8,13.5 11,13.5 Q14,13.5 14.2,10.5 M10,2.6 L10,4.4 M10,15.6 L10,17.4 M2.6,10 L4.4,10 M15.6,10 L17.4,10', useShapeFill: true, round: true },
  eternalLoopSym:  { d: 'M10,10 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0 M10,10 m-4.5,0 a4.5,4.5 0 1,1 9,0 a4.5,4.5 0 1,1 -9,0', strokePath: 'M13.5,4 L13.5,7 L16.5,7 M6.5,16 L6.5,13 L3.5,13', useShapeFill: true, round: true },
  temporalRiftSym: { d: 'M10,2 L12.5,7.5 L9.5,9 L14,11.5 L8,13 L13,18 L10.8,18 L6.5,13.5 L11.5,12 L6.5,8 L9.5,6.8 Z', strokePath: 'M12,5 a0.8,0.8 0 1,0 1.6,0 M8.5,15 a0.8,0.8 0 1,0 1.6,0 M15,13 a0.7,0.7 0 1,0 1.4,0 M4.5,12 a0.6,0.6 0 1,0 1.2,0 M15.5,7 a0.6,0.6 0 1,0 1.2,0', useShapeFill: true, round: true },
  instantSym:      { d: 'M10,3 A7,7 0 1,1 10,17 A7,7 0 1,1 10,3 M10,6.8 L10,13.2 M6.8,10 L13.2,10 M7.7,7.7 L12.3,12.3 M12.3,7.7 L7.7,12.3 M10,10 m-1.8,0 a1.8,1.8 0 1,0 3.6,0 a1.8,1.8 0 1,0 -3.6,0', round: true },
  eternitySym:     { d: 'M10,10 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0 M10,10 m-4.5,0 a4.5,4.5 0 1,1 9,0 a4.5,4.5 0 1,1 -9,0', strokePath: 'M8.5,1.8 L10,0.2 L11.5,1.8 M10,0.6 a0.45,0.45 0 1,0 0.9,0', useShapeFill: true, round: true },
  timelineSym:     { d: 'M1.5,10 L14.5,10 M14.5,10 L12,7.5 M14.5,10 L12,12.5 M4,10 a1,1 0 1,0 2,0 M7.5,10 a1,1 0 1,0 2,0 M11,10 a1,1 0 1,0 2,0', round: true },
  reincarnationSym:{ d: 'M10,17.5 C6.5,17.5 4.5,14.5 6,12.3 C7.5,10.2 11,10.8 11.8,8.8 C12.4,7.4 11,5.6 9.4,6.3 C8.3,6.8 8.4,8.2 9.4,8.5 C10.2,8.7 10.7,8 10.3,7.3 M10,3.5 L10,6 M8.5,5 L10,7 L11.5,5', round: true },
  chronoWeaverSym: { d: 'M2,2 L18,18 M2,18 L18,2 M7,7 L13,13 M13,7 L7,13 M3.5,12 Q10,15 16.5,12 M10,10 m-1.2,0 a1.2,1.2 0 1,0 2.4,0 a1.2,1.2 0 1,0 -2.4,0', round: true },
  temporalSigilSym:{ d: 'M17.2,7 L13,2.8 L7,2.8 L2.8,7 L2.8,13 L7,17.2 L13,17.2 L17.2,13 Z', strokePath: 'M8,6.5 L8,13.5 M12,6.5 L12,13.5', useShapeFill: true, round: true },
  // Уникальные иконки: свет/сны/отражения (ревизия дубликатов, партия 5)
  spectrumSym:     { d: 'M3,16.5 L17,16.5 M3.9,16.5 L3.9,13.5 M5.9,16.5 L5.9,11.5 M7.9,16.5 L7.9,9.5 M9.9,16.5 L9.9,7.5 M11.9,16.5 L11.9,9.5 M13.9,16.5 L13.9,11.5 M15.9,16.5 L15.9,13.5', round: true },
  dreamRealmSym:   { d: 'M3.5,10 A6.5,6.5 0 1,1 16.5,10 A6.5,6.5 0 1,1 3.5,10 M7.7,10 A4.6,4.6 0 1,0 16.9,10 A4.6,4.6 0 1,0 7.7,10', strokePath: 'M13,7.5 a1,1 0 1,0 2,0 M11.5,11.5 a0.8,0.8 0 1,0 1.6,0 M14.5,12.5 a0.7,0.7 0 1,0 1.4,0 M12,14.5 a0.6,0.6 0 1,0 1.2,0', useShapeFill: true, round: true },
  somniumSym:      { d: 'M4.5,9.5 Q10,6 15.5,9.5 Q10,13.5 4.5,9.5 Z', strokePath: 'M6,9.2 Q10,7.5 14,9.2 M5.5,11.5 Q10,13 14.5,11.5 M7,13.2 L7,15.5 M10,13.8 L10,16 M13,13.2 L13,15.5 M10,10 a0.9,0.9 0 1,0 1.8,0 a0.9,0.9 0 1,0 -1.8,0', useShapeFill: true, round: true },
  parallelWorldSym:{ d: 'M7.5,10 m-4.2,0 a4.2,4.2 0 1,0 8.4,0 a4.2,4.2 0 1,0 -8.4,0 M12.5,10 m-4.2,0 a4.2,4.2 0 1,0 8.4,0 a4.2,4.2 0 1,0 -8.4,0', strokePath: 'M7.5,10 a0.8,0.8 0 1,0 1.6,0 a0.8,0.8 0 1,0 -1.6,0 M12.5,10 a0.8,0.8 0 1,0 1.6,0 a0.8,0.8 0 1,0 -1.6,0', useShapeFill: true, round: true },
  // Ветка Духа — уникальные иконки (ревизия дублей)
  possessionSym:   { d: 'M7.2,5 a2.8,2.8 0 1,1 5.6,0 a2.8,2.8 0 1,1 -5.6,0 M4.5,18 C4.5,12.5 6.8,10 10,10 C13.2,10 15.5,12.5 15.5,18 Z', strokePath: 'M7.3,4.3 L9.3,6.3 M9.3,4.3 L7.3,6.3 M10.7,4.3 L12.7,6.3 M12.7,4.3 L10.7,6.3 M9,1.2 C9,0.5 11,0.5 11,1.2 C11,1.8 10.5,1.5 10,1.9 C9.5,1.5 9,1.8 9,1.2 Z', useShapeFill: true, round: true },
  spellboundSym:   { d: 'M2,10 C5,5 15,5 18,10 C15,15 5,15 2,10 Z', strokePath: 'M8.5,10 a1.5,1.5 0 1,1 3,0 a1.5,1.5 0 1,1 -3,0 M10,8.5 C11.2,8.7 11.6,9.7 11,10.4 C10.6,10.9 9.8,10.7 9.7,10.1 M4,6.5 L2.7,5 M16,6.5 L17.3,5 M10,4 L10,2.5', useShapeFill: true, round: true },
  exorcismSym:     { d: 'M8.7,2 L11.3,2 L11.3,7.3 L15,7.3 L15,10.7 L11.3,10.7 L11.3,18 L8.7,18 L8.7,10.7 L5,10.7 L5,7.3 L8.7,7.3 Z', strokePath: 'M3.5,3.5 L5.7,5.7 M16.5,3.5 L14.3,5.7 M3.5,16.5 L5.7,14.3 M16.5,16.5 L14.3,14.3', useShapeFill: true, round: true },
  breathSym:       { d: 'M5,17 C8,13 6,9 9,5 C9.6,4.3 9.3,3.4 8.4,3.6 M8,16.5 C11,12.5 9,8.5 12,4.5 C12.6,3.8 12.3,2.9 11.4,3.1 M11,15.5 C14,11.5 12,7.5 15,3.5 C15.6,2.8 15.3,1.9 14.4,2.1', round: true },
  astralFormSym:   { d: 'M7.5,5 a2.5,2.5 0 1,1 5,0 a2.5,2.5 0 1,1 -5,0 M5,18 C5,13 6,10.5 8,9.5 L7,7 L9,8.5 L10,7.5 L11,8.5 L13,7 L12,9.5 C14,10.5 15,13 15,18 Z', strokePath: 'M9.4,3.6 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0 M7.3,11.7 a0.55,0.55 0 1,0 1.1,0 a0.55,0.55 0 1,0 -1.1,0 M11.6,11.7 a0.55,0.55 0 1,0 1.1,0 a0.55,0.55 0 1,0 -1.1,0 M9.3,14.8 a0.7,0.7 0 1,0 1.4,0 a0.7,0.7 0 1,0 -1.4,0 M5.9,15.9 a0.45,0.45 0 1,0 0.9,0 a0.45,0.45 0 1,0 -0.9,0 M13.2,15.9 a0.45,0.45 0 1,0 0.9,0 a0.45,0.45 0 1,0 -0.9,0', useShapeFill: true, round: true },
  soulJarSym:      { d: 'M6,8 L6,15 A4,3 0 0,0 14,15 L14,8 C14,4.5 6,4.5 6,8 Z M8.5,2.5 L11.5,2.5 L11.5,4.5 L8.5,4.5 Z', strokePath: 'M8,11 C8,9 12,9 12,11 C12,12.3 10.6,12.6 10,12 C9.4,12.6 8,12.3 8,11 Z M8.65,10.3 a0.35,0.35 0 1,0 0.7,0 a0.35,0.35 0 1,0 -0.7,0 M10.65,10.3 a0.35,0.35 0 1,0 0.7,0 a0.35,0.35 0 1,0 -0.7,0', useShapeFill: true, round: true },
  spiritGuideSym:  { d: 'M10,2 L11.3,8.2 L17,10 L11.3,11.8 L10,18 L8.7,11.8 L3,10 L8.7,8.2 Z', strokePath: 'M9,12.5 C7,14.5 4.5,15.5 2.5,16.5 M9,12.5 C7.8,13.8 6.5,14.6 5.2,15.2', useShapeFill: true, round: true },
  seanceSym:       { d: 'M3,10 a7,7 0 1,1 14,0 a7,7 0 1,1 -14,0', strokePath: 'M10,3.3 L10,5.6 M10,14.4 L10,16.7 M3.3,10 L5.6,10 M14.4,10 L16.7,10 M5.5,5.5 L7,7 M13,13 L14.5,14.5 M14.5,5.5 L13,7 M7,13 L5.5,14.5 M8,10 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0', useShapeFill: true, round: true },
  ancestralChorusSym:{ d: 'M4,15 C4,10 4,7 6.5,7 C9,7 9,10 9,15 Z M8,17 C8,11 8,7 10.5,7 C13,7 13,11 13,17 Z M12,15 C12,10 12,7 14.5,7 C17,7 17,10 17,15 Z', strokePath: 'M6.5,12 L6.5,13 M14.5,12 L14.5,13 M10,11.5 a0.5,0.9 0 1,0 1,0 a0.5,0.9 0 1,0 -1,0', useShapeFill: true, round: true },
  spiritRealmSym:  { d: 'M4,18 L4,9 A6,6 0 0,1 16,9 L16,18 Z', strokePath: 'M7,15 C7,12 9,13 9,11 C9,9 7,10 7,8 M13,15 C13,12 11,13 11,11 C11,9 13,10 13,8', useShapeFill: true, round: true },
  ascensionSym:    { d: 'M10,1 L11,6.5 L15,3.5 L12.7,8 L17,7 L13.5,10 L17,13 L12.7,12 L15,16.5 L11,13.5 L10,19 L9,13.5 L5,16.5 L7.3,12 L3,13 L6.5,10 L3,7 L7.3,8 L5,3.5 L9,6.5 Z', strokePath: 'M8.5,9 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0 M8.7,15 L9.4,11.6 L10.6,11.6 L11.3,15', useShapeFill: true, round: true },
  animatedFleshSym:{ d: 'M7.7,4.3 a2.3,2.3 0 1,1 4.6,0 a2.3,2.3 0 1,1 -4.6,0 M6,7 L14,7 L14,18 L6,18 Z', strokePath: 'M6,12 L14,12 M7,10 L7.6,10.6 M7,10.6 L7.6,10 M9,10 L9.6,10.6 M9,10.6 L9.6,10 M11,10 L11.6,10.6 M11,10.6 L11.6,10 M13,10 L13.6,10.6 M13,10.6 L13.6,10 M9,14.5 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0', useShapeFill: true, round: true },
  // Ветка Хаоса — уникальные иконки (ревизия дублей)
  cataclysmSym:    { d: 'M3,10 a7,7 0 1,1 14,0 a7,7 0 1,1 -14,0', strokePath: 'M15,4 L12,7 L14,9 L10,12 L12,14 L8,17 M9,9 L9.7,7.3 M11.4,9.3 L10.7,7.6', useShapeFill: true, round: true },
  anarchySym:      { d: 'M4,6.5 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0 M15.3,11.7 A3,3 0 1,1 11.7,15.3 M12.3,14.5 L13.5,13 L11.8,12.3 M8.5,9 L11,11.5', round: true },
  discordSym:      { d: 'M3,10 L9,5 L9,15 Z M17,10 L11,5 L11,15 Z', strokePath: 'M10,3 L8.5,7 L11.5,9 L8,12 L11,17', useShapeFill: true, round: true },
  extinctionSym:   { d: 'M10,2.5 C14,2.5 16,7 16,11 C16,15.5 13.5,18 10,18 C6.5,18 4,15.5 4,11 C4,7 6,2.5 10,2.5 Z', strokePath: 'M6,6 L8,9 L6.5,11 L9,14 L7.5,16 M14,5 L12,8 L13.5,10', useShapeFill: true, round: true },
  veilSym:         { d: 'M2,2 L8.5,2 L8.5,14 C7.8,14 7.5,15.5 6.8,15.5 C6.1,15.5 5.8,14 5.1,14 C4.4,14 4.1,15.5 3.4,15.5 C2.7,15.5 2.4,14 2,14 Z M17.5,2 L11,2 L11,14 C11.7,14 12,15.5 12.7,15.5 C13.4,15.5 13.7,14 14.4,14 C15.1,14 15.4,15.5 16.1,15.5 C16.8,15.5 17.1,14 17.5,14 Z', strokePath: 'M4,3.5 L4,13 M6.5,3.5 L6.5,13 M13,3.5 L13,13 M15.5,3.5 L15.5,13', useShapeFill: true, round: true },
  // Ветка Космоса/Пространства — уникальные иконки (ревизия дублей)
  cosmicMonarchSym:{ d: 'M4,7 L6,3 L8,6.5 L10,2.5 L12,6.5 L14,3 L16,7 L16,9 L4,9 Z M10,11.5 L10.8,13.2 L12.5,14 L10.8,14.8 L10,16.5 L9.2,14.8 L7.5,14 L9.2,13.2 Z', strokePath: 'M10,17.3 L10,18.3 M6.3,14 L5.3,14 M13.7,14 L14.7,14', useShapeFill: true, round: true },
  vacuumSym:       { d: 'M3,7 L3,3 L7,3 M13,3 L17,3 L17,7 M3,13 L3,17 L7,17 M17,13 L17,17 L13,17', round: true },
  maelchaosSym:    { d: 'M2,4 L18,4 L15,7 L5,7 Z M5,7 L15,7 L12.5,10.5 L7.5,10.5 Z M7.5,10.5 L12.5,10.5 L11,13.5 L9,13.5 Z M9,13.5 L11,13.5 L10,17 Z', useShapeFill: true, round: true },
  heatDeathSym:    { d: 'M8.7,10 a1.3,1.3 0 1,0 2.6,0 a1.3,1.3 0 1,0 -2.6,0', strokePath: 'M5.5,10 a4.5,4.5 0 1,0 9,0 a4.5,4.5 0 1,0 -9,0 M10,3 A7,7 0 0,1 16.5,8.5 M13.5,16.1 A7,7 0 0,1 6.5,16.1 M3.5,8.5 A7,7 0 0,1 6,3.6', useShapeFill: true, round: true },
  horizonSym:      { d: 'M4,11 A6,6 0 0,1 16,11 Z', strokePath: 'M2,11 L18,11 M10,2 L10,3.5 M5,4 L6,5.2 M15,4 L14,5.2', useShapeFill: true, round: true },
  voidExpanseSym:  { d: 'M9.3,10 a0.7,0.7 0 1,0 1.4,0 a0.7,0.7 0 1,0 -1.4,0', strokePath: 'M10,8.5 L10,6 M10,4.5 L10,2 M10,11.5 L10,14 M10,15.5 L10,18 M8.5,10 L6,10 M4.5,10 L2,10 M11.5,10 L14,10 M15.5,10 L18,10', useShapeFill: true, round: true },
  infiniteRealmsSym:{ d: 'M10,2 L18,10 L10,18 L2,10 Z M10,5 L15,10 L10,15 L5,10 Z M10,7.5 L12.5,10 L10,12.5 L7.5,10 Z', round: true },
  voidCollapseSym: { d: 'M6,2 L14,2 L10,10 Z M18,6 L18,14 L10,10 Z M14,18 L6,18 L10,10 Z M2,14 L2,6 L10,10 Z M9,10 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0', useShapeFill: true, round: true },
  primeMatterSym:  { d: 'M10,2.3 C13.5,2.3 16.5,5.2 16.7,9 C16.9,12.8 14,16.5 10.3,16.7 C6.5,16.9 3.3,14 3.1,10.2 C2.9,6.4 6.2,2.5 10,2.3 Z', strokePath: 'M9.3,10 a0.7,0.7 0 1,0 1.4,0 a0.7,0.7 0 1,0 -1.4,0 M10,7.5 L10,6.3 M12.2,11.3 L13.2,12 M7.8,11.3 L6.8,12', useShapeFill: true, round: true },
  entropyFieldSym: { d: 'M3,4 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M15,5 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M3,16 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M15.2,15 a0.8,0.8 0 1,0 1.6,0 a0.8,0.8 0 1,0 -1.6,0 M8.7,10 a1.3,1.3 0 1,0 2.6,0 a1.3,1.3 0 1,0 -2.6,0', strokePath: 'M3.3,3.3 L1.8,1.8 M16.7,4.3 L18.2,2.8 M3.3,16.7 L1.8,18.2 M15.9,15.9 L16.6,16.6', useShapeFill: true, round: true },
  oblivionSym:     { d: 'M4,10 a6,6 0 1,1 12,0 a6,6 0 1,1 -12,0', strokePath: 'M17,8 L17,12 L12.3,10 Z M16.3,2.7 L18.2,4.6 L13.3,6.4 Z M3.7,2.7 L1.8,4.6 L6.7,6.4 Z M3,8 L3,12 L7.7,10 Z M3.7,17.3 L1.8,15.4 L6.7,13.6 Z M16.3,17.3 L18.2,15.4 L13.3,13.6 Z M7,7 L9,10 L7.5,12 L11,15', useShapeFill: true, round: true },
  continuumSym:    { d: 'M2.5,10 a4,4 0 1,1 8,0 a4,4 0 1,1 -8,0 M9.5,10 a4,4 0 1,1 8,0 a4,4 0 1,1 -8,0 M5.5,10 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M12.9,8 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0 M14.9,11 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0 M11.2,11.3 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0', round: true },
  entropyLordSym:  { d: 'M4,8 L5.5,3.5 L7.5,7 L10,2.5 L12.5,7 L14.5,3.5 L16,8 L16,9.5 L4,9.5 Z M10,11 C12,11 13,12.5 12,14 C11.3,15 9.8,14.7 10,13.5 M7.4,16 a0.6,0.6 0 1,0 1.2,0 a0.6,0.6 0 1,0 -1.2,0 M5.6,17.5 a0.4,0.4 0 1,0 0.8,0 a0.4,0.4 0 1,0 -0.8,0', useShapeFill: true, round: true },
  chaosLordSym:    { d: 'M4,9 L5,3 L7,6.5 L9.5,2 L11,7.5 L13.5,3.5 L16,9.5 L16,11 L4,11 Z M6,13 L7,14.5 L5.5,15 L6.5,16.5 M13,13.5 L12,15 L13.5,15.5 L12.5,17 M9.3,12.5 L10.2,14 L9.5,14.8', useShapeFill: true, round: true },
  masterOfTimeSym: { d: 'M4,9 L5.5,4 L7.5,7.5 L10,3 L12.5,7.5 L14.5,4 L16,9 L16,10.5 L4,10.5 Z M7.5,12.5 L12.5,12.5 L10,15.5 Z M7.5,18 L12.5,18 L10,15.5 Z', strokePath: 'M7,12 L13,12 M7,18.3 L13,18.3', useShapeFill: true, round: true },
  masterOfSpaceSym:{ d: 'M4,9 L5.5,4 L7.5,7.5 L10,3 L12.5,7.5 L14.5,4 L16,9 L16,10.5 L4,10.5 Z M8,14.5 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0', strokePath: 'M4,14.5 A6,2 0 1,0 16,14.5 A6,2 0 1,0 4,14.5', useShapeFill: true, round: true },
  // Ветка Средоточия Стихий
  elementalConfluenceSym:{ d: 'M8.7,10 a1.3,1.3 0 1,0 2.6,0 a1.3,1.3 0 1,0 -2.6,0 M10,8.3 C11,6.5 10.8,3.5 10,1.8 C9.2,3.5 9,6.5 10,8.3 Z M11.7,10 C13.5,9 16.5,9.2 18.2,10 C16.5,10.8 13.5,11 11.7,10 Z M10,11.7 C10,11.7 8.5,13.5 9.3,15.7 C9.8,17 11.3,16.8 11.2,15.4 M8.3,10 L1.8,8.5 L1.8,11.5 Z', useShapeFill: true, round: true },
  fifthElementSym:{ d: 'M8.7,10 a1.3,1.3 0 1,0 2.6,0 a1.3,1.3 0 1,0 -2.6,0 M10,8.3 C11,6.5 10.8,3.5 10,1.8 C9.2,3.5 9,6.5 10,8.3 Z M11.7,10 C13.5,9 16.5,9.2 18.2,10 C16.5,10.8 13.5,11 11.7,10 Z M10,11.7 C10,11.7 8.5,13.5 9.3,15.7 C9.8,17 11.3,16.8 11.2,15.4 M8.3,10 L1.8,8.5 L1.8,11.5 Z', strokePath: 'M1.3,10 a8.7,8.7 0 1,0 17.4,0 a8.7,8.7 0 1,0 -17.4,0', useShapeFill: true, round: true },
  elementalWardenSym:{ d: 'M7.5,5 a2.5,2.5 0 1,1 5,0 a2.5,2.5 0 1,1 -5,0 M5,18 C5,13 6.5,10.5 10,10.5 C13.5,10.5 15,13 15,18 Z M3.2,7 a0.8,0.8 0 1,0 1.6,0 a0.8,0.8 0 1,0 -1.6,0 M15.2,7 a0.8,0.8 0 1,0 1.6,0 a0.8,0.8 0 1,0 -1.6,0 M4.2,14.5 a0.7,0.7 0 1,0 1.4,0 a0.7,0.7 0 1,0 -1.4,0 M14.3,14.5 a0.7,0.7 0 1,0 1.4,0 a0.7,0.7 0 1,0 -1.4,0', useShapeFill: true, round: true },
  elementalRuptureSym:{ d: 'M10,8.3 C11,6.5 10.8,3.5 10,1.8 C9.2,3.5 9,6.5 10,8.3 Z M11.7,10 C13.5,9 16.5,9.2 18.2,10 C16.5,10.8 13.5,11 11.7,10 Z M10,11.7 C10,11.7 8.5,13.5 9.3,15.7 C9.8,17 11.3,16.8 11.2,15.4 M8.3,10 L1.8,8.5 L1.8,11.5 Z', strokePath: 'M3,4 L8,9 L5,11 L11,15 L9,17', useShapeFill: true, round: true },
  // Мосты между базовыми и вторыми стихиями
  zealSym:      { d: 'M10,2 C12,5 12.5,8 11,11 C13,9.5 13.5,12 12,14.5 C10.5,17 9.5,17 8,14.5 C6.5,12 7,9.5 9,11 C7.5,8 8,5 10,2 Z M10,15.3 L11,16.8 L10,18.3 L9,16.8 Z', useShapeFill: true, round: true },
  tearsSym:     { d: 'M10,4 C12,7 13,10 10,13 C7,10 8,7 10,4 Z M5,9 C6,11 6.5,12.5 5,14 C3.5,12.5 4,11 5,9 Z M15,9 C16,11 16.5,12.5 15,14 C13.5,12.5 14,11 15,9 Z', useShapeFill: true, round: true },
  locusSym:     { d: 'M9,10 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0', strokePath: 'M10,2 L10,6 M10,14 L10,18 M2,10 L6,10 M14,10 L18,10', useShapeFill: true, round: true },
  futilitySym:  { d: 'M9,18 L9,11 L7,11 L10,5 L13,11 L11,11 L11,17 Z', strokePath: 'M10,4.3 a0.5,0.5 0 1,0 1,0 a0.5,0.5 0 1,0 -1,0 M7.2,3 a0.35,0.35 0 1,0 0.7,0 a0.35,0.35 0 1,0 -0.7,0 M13,2.6 a0.25,0.25 0 1,0 0.5,0 a0.25,0.25 0 1,0 -0.5,0 M9.2,1 a0.15,0.15 0 1,0 0.3,0 a0.15,0.15 0 1,0 -0.3,0', useShapeFill: true, round: true },
  hollowSym:    { d: 'M10,2 C7,2 6,5 6,7 C4,9 4,14 4,17 L16,17 C16,14 16,9 14,7 C14,5 13,2 10,2 Z M8,7 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0', round: true },
  volatileMatterSym:{ d: 'M7,4 L13,3 L16,8 L14,14 L9,17 L4,12 L5,7 Z', strokePath: 'M8,6 L10,10 L8,13 M15,9 L16.5,8.5 L17,10.5 L15.5,11', useShapeFill: true, round: true },
  fadingSym:    { d: 'M7,18 L7,13 C7,10 8,9 10,9 C12,9 13,10 13,13 L13,18 Z M8.5,6.5 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0 M9.1,3.8 a0.9,0.9 0 1,0 1.8,0 a0.9,0.9 0 1,0 -1.8,0 M9.5,1.8 a0.5,0.5 0 1,0 1,0 a0.5,0.5 0 1,0 -1,0', useShapeFill: true, round: true },
  timeShardSym: { d: 'M10,2 L13,7 L11.5,17 L8.5,17 L7,7 Z', strokePath: 'M10,8 L10,10 L11.3,10.7', useShapeFill: true, round: true },
  chronicleSym: { d: 'M2,5 L9.5,4 L9.5,16 L2,17 Z M18,5 L10.5,4 L10.5,16 L18,17 Z', strokePath: 'M4,7.5 L8,7 M4,10 L8,9.5 M4,12.5 L8,12 M12,7 L16,7.5 M12,9.5 L16,10 M12,12 L16,12.5', useShapeFill: true, round: true },
  // Второй слой — соединения мостов друг с другом
  purposeSym:   { d: 'M3,3 L9.5,9.5 L8.3,10.7 L1.8,4.2 Z M10,11.3 C11,9.8 11.3,8.3 10.5,7.3 C10,8.3 9.3,9.8 10,11.3 Z', strokePath: 'M6.7,13.3 a3.3,3.3 0 1,0 6.6,0 a3.3,3.3 0 1,0 -6.6,0', useShapeFill: true, round: true },
  requiemSym:   { d: 'M10,6 C12.5,9.5 13.5,13 10,16.5 C6.5,13 7.5,9.5 10,6 Z', strokePath: 'M10,4.5 a0.8,0.8 0 1,0 0.01,0 M8.7,2.3 a0.5,0.5 0 1,0 0.01,0 M11.5,1.8 a0.3,0.3 0 1,0 0.01,0', useShapeFill: true, round: true },
  huskSym:      { d: 'M10,2 C7,2 6,5 6,7 C4,9 4,14 4,17 L16,17 C16,14 16,9 14,7 C14,5 13,2 10,2 Z', strokePath: 'M8,7 L10,11 L8,14 M12,8 L10.5,11 L12.5,13 M9,16.5 L9.5,15 M11,16.5 L10.5,15', useShapeFill: true, round: true },
  forgottenPageSym:{ d: 'M4,3 L14,3 L16,5 L16,17 L4,17 Z M14,3 L14,5 L16,5 Z', strokePath: 'M6,7.5 L12,7.5 M6,10 L12,10 M6,12.5 L10,12.5 M9,2.3 a0.4,0.4 0 1,0 0.01,0 M11.5,1 a0.25,0.25 0 1,0 0.01,0', useShapeFill: true, round: true },
  ardentGuardianSym:{ d: 'M7.5,5 a2.5,2.5 0 1,1 5,0 a2.5,2.5 0 1,1 -5,0 M5,18 C5,13 6.5,10.5 10,10.5 C13.5,10.5 15,13 15,18 Z M10,0.3 C11,1.5 11.2,2.5 10.5,3.2 C11,2.2 10.3,1.5 10,0.3 C9.7,1.5 9,2.2 9.5,3.2 C8.8,2.5 9,1.5 10,0.3 Z', strokePath: 'M3.2,9 a0.7,0.7 0 1,0 0.01,0 M16.8,9 a0.7,0.7 0 1,0 0.01,0', useShapeFill: true, round: true },
  axisSym:      { d: 'M8.8,10 a1.2,1.2 0 1,0 2.4,0 a1.2,1.2 0 1,0 -2.4,0', strokePath: 'M1.5,10 a8.5,8.5 0 1,0 17,0 a8.5,8.5 0 1,0 -17,0 M10,3 L10,6 M10,14 L10,17 M3,10 L6,10 M14,10 L17,10', useShapeFill: true, round: true },
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
  water:    { shape: 'circle',   glyph: 'waves',   rot: 0 },
  earth:    { shape: 'circle',   glyph: 'mountains', rot: 0 },
  air:      { shape: 'circle',   glyph: 'airsym',  rot: 0 },
  void:     { shape: 'circle',   glyph: 'voidsym',  rot: 0 },
  // state (triangle)
  steam:    { shape: 'triangle', glyph: 'vapor',    rot: 0 },
  hotSteam: { shape: 'triangle', glyph: 'vaporHot', rot: 0 },
  wetSteam: { shape: 'triangle', glyph: 'vaporCold', rot: 0 },
  ice:      { shape: 'triangle', glyph: 'iceCube', rot: 0 },
  mist:     { shape: 'triangle', glyph: 'fog',     rot: 0 },
  dust:     { shape: 'triangle', glyph: 'particles', rot: 0 },
  ash:      { shape: 'triangle', glyph: 'ember',   rot: 0 },
  lava:     { shape: 'triangle', glyph: 'volcano',  rot: 0 },
  magma:    { shape: 'triangle', glyph: 'volcanoFire',  rot: 0 },
  scoria:   { shape: 'triangle', glyph: 'cinder',   rot: 0 },
  mud:      { shape: 'triangle', glyph: 'splat',   rot: 0 },
  sludge:   { shape: 'triangle', glyph: 'swirl',   rot: 0 },
  storm:    { shape: 'triangle', glyph: 'cyclone', rot: 0 },
  inferno:  { shape: 'triangle', glyph: 'infernal', rot: 0 },
  gale:     { shape: 'triangle', glyph: 'gust',    rot: 0 },
  thunder:  { shape: 'triangle', glyph: 'thunderBolt', rot: 0 },
  frost:    { shape: 'triangle', glyph: 'dendrite', rot: 0 },
  bubble:   { shape: 'triangle', glyph: 'bubble',    rot: 0 },
  echo:     { shape: 'triangle', glyph: 'echoWaves', rot: 0 },
  // nature (diamond)
  wood:     { shape: 'diamond',  glyph: 'log',     rot: 0 },
  forest:   { shape: 'diamond',  glyph: 'trees',    rot: 0 },
  flower:   { shape: 'diamond',  glyph: 'flowerBloom', rot: 0 },
  life:     { shape: 'diamond',  glyph: 'heart',    rot: 0 },
  swamp:    { shape: 'diamond',  glyph: 'swampReeds', rot: 0 },
  poison:   { shape: 'diamond',  glyph: 'skullDrop',  rot: 0 },
  spring:   { shape: 'diamond',  glyph: 'springFountain', rot: 0 },
  mountain: { shape: 'diamond',  glyph: 'peak',     rot: 0 },
  moss:     { shape: 'diamond',  glyph: 'clump',    rot: 0 },
  coral:    { shape: 'diamond',  glyph: 'coralBranch', rot: 0 },
  vine:     { shape: 'diamond',  glyph: 'tendril',  rot: 0 },
  root:     { shape: 'diamond',  glyph: 'taproot',  rot: 0 },
  mushroom: { shape: 'diamond',  glyph: 'fungus',   rot: 0 },
  seed:     { shape: 'diamond',  glyph: 'seed',     rot: 0 },
  // metal (square)
  metal:    { shape: 'square',   glyph: 'ingot',    rot: 0 },
  steel:    { shape: 'square',   glyph: 'ingot',    rot: 0 },
  blade:    { shape: 'square',   glyph: 'sword',    rot: 0 },
  rust:     { shape: 'square',   glyph: 'ingotRust', rot: 0 },
  stone:    { shape: 'square',   glyph: 'roughgem',  rot: 0 },
  crystal:  { shape: 'square',   glyph: 'gemfacets', rot: 0 },
  diamond:  { shape: 'square',   glyph: 'gemdia',    rot: 0 },
  gold:     { shape: 'square',   glyph: 'ingot',    rot: 0 },
  silver:   { shape: 'square',   glyph: 'ingot',    rot: 0 },
  iron:     { shape: 'square',   glyph: 'ingotIron', rot: 0 },
  // artifact (hexagon)
  glass:    { shape: 'hexagon',  glyph: 'glasspn',   rot: 0 },
  brick:    { shape: 'hexagon',  glyph: 'brickblk',   rot: 0 },
  ceramic:  { shape: 'hexagon',  glyph: 'ceramicblk', rot: 0 },
  clay:     { shape: 'hexagon',  glyph: 'clayblob',   rot: 0 },
  crown:    { shape: 'hexagon',  glyph: 'crownsym',   rot: 0 },
  amulet:   { shape: 'hexagon',  glyph: 'amuletsym',  rot: 0 },
  rune:     { shape: 'hexagon',  glyph: 'runesym',    rot: 0 },
  prism:    { shape: 'hexagon',  glyph: 'prismshp',   rot: 0 },
  mirror:   { shape: 'hexagon',  glyph: 'mirrorpn',   rot: 0 },
  clockwork:{ shape: 'hexagon',  glyph: 'gear',       rot: 0 },
  scroll:   { shape: 'hexagon',  glyph: 'scrollsym',  rot: 0 },
  lantern:  { shape: 'hexagon',  glyph: 'lantrnsym',  rot: 0 },
  key:      { shape: 'hexagon',  glyph: 'keysym',     rot: 0 },
  shield:   { shape: 'hexagon',  glyph: 'tee',     rot: 45 },
  // magic (star)
  light:    { shape: 'star',     glyph: 'lightsym',   rot: 0 },
  shadow:   { shape: 'star',     glyph: 'shadowsym',  rot: 0 },
  essence:  { shape: 'star',     glyph: 'essencesym', rot: 0 },
  ghost:    { shape: 'star',     glyph: 'ghostsym',   rot: 0 },
  golem:    { shape: 'star',     glyph: 'golemsym',   rot: 0 },
  phoenix:  { shape: 'star',     glyph: 'phoenixGlyph',   rot: 0 },
  chimera:  { shape: 'star',     glyph: 'chimerasym', rot: 0, glow: 0.18 },
  abyss:    { shape: 'star',     glyph: 'abysssym',   rot: 0 },
  rift:     { shape: 'star',     glyph: 'riftsym',    rot: 0 },
  mirage:   { shape: 'star',     glyph: 'miragesym',  rot: 0 },
  siren:    { shape: 'diamond',  glyph: 'sirensym',   rot: 0 },
  wand:     { shape: 'star',     glyph: 'wandsym',    rot: 0 },
  curse:    { shape: 'star',     glyph: 'cursesym',   rot: 0 },
  fairy:    { shape: 'star',     glyph: 'fairysym',   rot: 0 },
  phantom:  { shape: 'star',     glyph: 'phantomsym', rot: 0 },
  philosophersStone: { shape: 'star', glyph: 'sigil', rot: 0, glow: 0.25 },
  // cosmos (circle)
  ether:    { shape: 'circle',   glyph: 'ethersym',   rot: 0 },
  star:     { shape: 'circle',   glyph: 'starsym',    rot: 0 },
  nova:     { shape: 'circle',   glyph: 'novasym',    rot: 0 },
  meteor:   { shape: 'circle',   glyph: 'meteorsym',  rot: 0 },
  eclipse:  { shape: 'circle',   glyph: 'eclipsesym', rot: 0 },
  moon:     { shape: 'circle',   glyph: 'moonsym',    rot: 0 },
  sun:      { shape: 'circle',   glyph: 'sunray',     rot: 0 },
  galaxy:   { shape: 'circle',   glyph: 'galaxysym',  rot: 0 },
  // alchemy (diamond)
  potion:   { shape: 'diamond',  glyph: 'flask',   rot: 0 },
  acid:     { shape: 'diamond',  glyph: 'flaskBubbly',   rot: 30 },
  pearl:    { shape: 'diamond',  glyph: 'pearlsym',     rot: 0 },
  sand:     { shape: 'diamond',  glyph: 'sandsym',     rot: 0 },
  obsidian: { shape: 'diamond',  glyph: 'diamond', rot: 90 },
  fossil:   { shape: 'diamond',  glyph: 'fossilsym',   rot: 0 },
  geyser:   { shape: 'diamond',  glyph: 'geysersym',    rot: 0 },
  hurricane:{ shape: 'diamond',  glyph: 'hurricanSym',  rot: 0 },
  lightning:{ shape: 'diamond',  glyph: 'bolt',    rot: 0 },
  plasma:   { shape: 'diamond',  glyph: 'plasmasym',    rot: 0 },
  death:    { shape: 'diamond',  glyph: 'skull',   rot: 0 },
  amber:    { shape: 'diamond',  glyph: 'ambersym',     rot: 0 },
  elixir:   { shape: 'diamond',  glyph: 'vial',   rot: 0 },
  catalyst: { shape: 'diamond',  glyph: 'catalystsym', rot: 0 },
  salt:     { shape: 'diamond',  glyph: 'saltsym',     rot: 0 },
  // Tria Prima (alchemy)
  rawSulfur:    { shape: 'diamond', glyph: 'rawSulfurSym',  rot: 0 },
  rawMercury:   { shape: 'diamond', glyph: 'rawMercurySym', rot: 0 },
  sulfurPhil:   { shape: 'diamond', glyph: 'rawSulfurSym',  rot: 0 },
  mercuryPhil:  { shape: 'diamond', glyph: 'rawMercurySym', rot: 0 },
  saltPhil:     { shape: 'diamond', glyph: 'saltPhilSym',   rot: 0 },
  // Magnum Opus (alchemy)
  nigredo:      { shape: 'diamond', glyph: 'nigredoSym',    rot: 0 },
  albedo:       { shape: 'diamond', glyph: 'albedoSym',     rot: 0 },
  citrinitas:   { shape: 'diamond', glyph: 'citrinitasSym', rot: 0 },
  rubedo:       { shape: 'diamond', glyph: 'rubedoSym',     rot: 0 },
  // Rebis (magic)
  rex:          { shape: 'star',    glyph: 'rexSym',        rot: 0 },
  regina:       { shape: 'star',    glyph: 'reginaSym',     rot: 0 },
  rebis:        { shape: 'star',    glyph: 'rebisSym',      rot: 0 },
  // Athanor (artifact)
  athanor:      { shape: 'hexagon', glyph: 'athanorSym',    rot: 0 },
  philosophersEgg: { shape: 'hexagon', glyph: 'eggSym',     rot: 0 },
  // Quintessence (cosmos)
  quintessence: { shape: 'circle',  glyph: 'starsym',       rot: 0 },
  // Solve et Coagula (alchemy)
  azoth:        { shape: 'star',    glyph: 'azothSym',       rot: 0 },
  solve:        { shape: 'diamond', glyph: 'solveSym',       rot: 0 },
  coagula:      { shape: 'diamond', glyph: 'coagulaSym',     rot: 0 },
  alkahest:     { shape: 'diamond', glyph: 'alkahestSym',    rot: 0 },
  // Микрокосм
  vesselOfLife: { shape: 'hexagon', glyph: 'vesselSym',      rot: 0 },
  homunculus:   { shape: 'star',    glyph: 'homunculusSym',  rot: 0 },
  adept:        { shape: 'star',    glyph: 'adeptSym',       rot: 0 },
  // Эликсиры
  aurumPotabile:{ shape: 'diamond', glyph: 'aurumPotabileSym', rot: 0, glow: 0.2 },
  elixirVitae:  { shape: 'diamond', glyph: 'elixirVitaeSym', rot: 0 },
  panacea:      { shape: 'star',    glyph: 'panaceaSym',     rot: 0, glow: 0.2 },
  ambrosia:     { shape: 'circle',  glyph: 'ambrosiaSym',    rot: 0 },
  // Макрокосм
  macrocosm:    { shape: 'circle',  glyph: 'macrocosmSym',   rot: 0 },
  hermeticSeal: { shape: 'hexagon', glyph: 'hermeticSym',    rot: 0 },
  // Финал
  animaMundi:   { shape: 'star',    glyph: 'animaMundiSym',  rot: 0, glow: 0.15 },
  // Мутация
  basilisk:     { shape: 'diamond', glyph: 'basiliskSym',    rot: 0 },
  wyvern:       { shape: 'diamond', glyph: 'wyvernSym',      rot: 0 },
  leviathan:    { shape: 'diamond', glyph: 'leviathanSym',  rot: 0 },
  // Поглощение
  voidRift:     { shape: 'star',    glyph: 'voidRiftSym',    rot: 0 },
  blackHole:    { shape: 'circle',  glyph: 'blackHoleSym',   rot: 0 },
  singularity:  { shape: 'star',    glyph: 'singularitySym', rot: 0, glow: 0.1 },
  // Иллюзия
  illusion:     { shape: 'hexagon', glyph: 'illusionSym',    rot: 0 },
  trickster:    { shape: 'hexagon', glyph: 'tricksterSym',   rot: 0 },
  nemesis:      { shape: 'star',    glyph: 'nemesisSym',     rot: 0 },
  // Время
  timepiece:    { shape: 'hexagon', glyph: 'timepieceSym',   rot: 0 },
  chronomancer: { shape: 'star',    glyph: 'chronomancerSym',rot: 0 },
  paradox:      { shape: 'star',    glyph: 'paradoxSym',     rot: 0 },
  // Разложение
  spore:        { shape: 'circle',  glyph: 'sporeSym',       rot: 0 },
  plague:       { shape: 'diamond', glyph: 'plagueSym',      rot: 0 },
  parasite:     { shape: 'diamond', glyph: 'parasiteSym',    rot: 0 },
  // Катализ
  ignition:     { shape: 'diamond', glyph: 'ignitionSym',    rot: 0 },
  engine:       { shape: 'square',  glyph: 'pistonEngineSym',rot: 0 },
  // Янтарь
  amberRelic:   { shape: 'hexagon', glyph: 'ambersym',       rot: 0 },
  revenant:     { shape: 'star',    glyph: 'ghostsym',       rot: 0 },
  // Спектр
  spectrum:     { shape: 'square',  glyph: 'spectrumSym',     rot: 0 },
  aurora:       { shape: 'circle',  glyph: 'auroraSym',      rot: 0 },
  auroraCrown:  { shape: 'hexagon', glyph: 'crownsym',       rot: 0 },
  // Страж
  livingShield: { shape: 'diamond', glyph: 'livingShieldSym',rot: 0 },
  guardian:     { shape: 'diamond', glyph: 'guardianSym',    rot: 0 },
  sentinel:     { shape: 'star',    glyph: 'sentinelSym',    rot: 0 },
  // Эхо
  canyon:       { shape: 'diamond', glyph: 'peak',           rot: 0 },
  whisperingWinds:{ shape: 'diamond', glyph: 'whisperingWindsSym', rot: 0 },
  banshee:      { shape: 'star',    glyph: 'ghostsym',       rot: 0 },
  // Технологии
  plasmaBlade:  { shape: 'square',  glyph: 'plasmaEnergySym',rot: 0, glow: 0.12 },
  resonator:    { shape: 'hexagon', glyph: 'prismshp',       rot: 0 },
  overcharge:   { shape: 'star',    glyph: 'lightningsym',   rot: 0 },
  // Катаклизмы
  maelstrom:    { shape: 'diamond', glyph: 'maelstromSym',   rot: 0 },
  tempest:      { shape: 'diamond', glyph: 'tempestSym',      rot: 15 },
  cataclysm:    { shape: 'star',    glyph: 'cataclysmSym',   rot: 0 },
  // Сон
  stasis:       { shape: 'diamond', glyph: 'iceCube',        rot: 0 },
  dreamRealm:   { shape: 'star',    glyph: 'dreamRealmSym',  rot: 0 },
  somnium:      { shape: 'circle',  glyph: 'somniumSym',     rot: 0 },
  // Древний лес
  ancientGrove: { shape: 'diamond', glyph: 'ancientGroveSym',rot: 0 },
  treant:       { shape: 'diamond', glyph: 'treantSym',      rot: 0 },
  worldTree:    { shape: 'diamond', glyph: 'worldTreeSym',   rot: 0 },
  // Некромантия
  grimoire:     { shape: 'hexagon', glyph: 'scrollsym',      rot: 0 },
  necronomicon: { shape: 'hexagon', glyph: 'runesym',        rot: 0 },
  lich:         { shape: 'star',    glyph: 'skull',          rot: 0 },
  // Кросс-комбо
  abyssalSovereign:{ shape: 'star',   glyph: 'sovereignSym',    rot: 0 },
  eternalBlight:   { shape: 'diamond', glyph: 'eternalBlightSym',rot: 0, glow: 0.15 },
  choirOfSorrow:   { shape: 'diamond', glyph: 'choirOfSorrowSym', rot: 0 },
  cosmicMonarch:   { shape: 'star',    glyph: 'cosmicMonarchSym',rot: 0 },
  fatebreaker:     { shape: 'diamond', glyph: 'fatebreakerSym',  rot: 0 },
  virulentSwarm:   { shape: 'triangle',glyph: 'virulentSwarmSym',rot: 0 },
  oneirograph:     { shape: 'square',  glyph: 'oneirographSym',   rot: 0 },
  deathlessWarden: { shape: 'square',  glyph: 'deathlessWardenSym', rot: 0 },
  apocalypse:      { shape: 'hexagon', glyph: 'apocalypseSym',   rot: 0, glow: 0.22 },
  // Врата — Дух и Материя
  spirit:      { shape: 'circle',  glyph: 'spiritSym',    rot: 0 },
  matter:      { shape: 'square',  glyph: 'matterSym',    rot: 0 },
  // Врата — Время и Пространство
  time:        { shape: 'diamond', glyph: 'timeSym',      rot: 0 },
  space:       { shape: 'circle',  glyph: 'spaceSym',     rot: 0 },
  // Врата — Хаос и Энтропия
  chaos:       { shape: 'triangle',glyph: 'chaosSym',     rot: 0 },
  entropy:     { shape: 'diamond', glyph: 'entropySym',   rot: 0 },
  // Дух — ветка
  possession:  { shape: 'star',    glyph: 'possessionSym', rot: 0 },
  spellbound:  { shape: 'hexagon', glyph: 'spellboundSym', rot: 0 },
  exorcism:    { shape: 'star',    glyph: 'exorcismSym',   rot: 0 },
  // Материя — ветка
  mass:        { shape: 'diamond', glyph: 'massSym',      rot: 0 },
  density:     { shape: 'diamond', glyph: 'densitySym',   rot: 0 },
  compression: { shape: 'square',  glyph: 'engineSym',    rot: 0 },
  // Время — ветка
  chronosphere:{ shape: 'circle',  glyph: 'chronosphereSym', rot: 0 },
  eternalLoop: { shape: 'circle',  glyph: 'eternalLoopSym',  rot: 0 },
  temporalRift:{ shape: 'star',    glyph: 'temporalRiftSym', rot: 0 },
  // Пространство — ветка
  vacuum:      { shape: 'circle',  glyph: 'vacuumSym',    rot: 0 },
  nebula:      { shape: 'circle',  glyph: 'auroraSym',    rot: 0 },
  multiverse:  { shape: 'star',    glyph: 'macrocosmSym', rot: 0 },
  // Хаос — ветка
  maelchaos:   { shape: 'triangle',glyph: 'maelchaosSym', rot: 0 },
  anarchy:     { shape: 'star',    glyph: 'anarchySym', rot: 0 },
  primordialStorm:{ shape: 'hexagon',glyph: 'hurricanSym',rot: 0 },
  // Энтропия — ветка
  decay:       { shape: 'triangle',glyph: 'decaySym',     rot: 0 },
  ruin:        { shape: 'diamond', glyph: 'ruinSym',      rot: 0 },
  heatDeath:   { shape: 'circle',  glyph: 'heatDeathSym', rot: 0 },
  // Ветка Духа
  breath:        { shape: 'circle',  glyph: 'breathSym',        rot: 0 },
  astralForm:    { shape: 'star',    glyph: 'astralFormSym',    rot: 0 },
  soulJar:       { shape: 'hexagon', glyph: 'soulJarSym',       rot: 0 },
  spiritGuide:   { shape: 'star',    glyph: 'spiritGuideSym',   rot: 0 },
  seance:        { shape: 'hexagon', glyph: 'seanceSym',        rot: 0 },
  possessedArmor:{ shape: 'square',  glyph: 'possessedArmorSym', rot: 0 },
  wraithLord:    { shape: 'star',    glyph: 'wraithLordSym',    rot: 0 },
  ancestralChorus:{shape: 'star',    glyph: 'ancestralChorusSym', rot: 0 },
  spiritRealm:   { shape: 'circle',  glyph: 'spiritRealmSym',   rot: 0 },
  transcendence: { shape: 'star',    glyph: 'ascensionSym',     rot: 0 },
  // Ветка Материи
  substance:     { shape: 'diamond', glyph: 'substanceSym',     rot: 0 },
  bedrock:       { shape: 'diamond', glyph: 'bedrockSym',       rot: 0 },
  monolith:      { shape: 'square',  glyph: 'monolithSym',      rot: 0 },
  golemCore:     { shape: 'hexagon', glyph: 'golemsym',         rot: 0 },
  ironWill:      { shape: 'square',  glyph: 'ironWillSym',      rot: 0 },
  forgeHeart:    { shape: 'triangle',glyph: 'forgeHeartSym',    rot: 0 },
  worldAnvil:    { shape: 'hexagon', glyph: 'worldAnvilSym',    rot: 0 },
  absoluteMass:  { shape: 'circle',  glyph: 'absoluteMassSym',  rot: 0 },
  titan:         { shape: 'star',    glyph: 'titanSym',         rot: 0 },
  primeMatter:   { shape: 'circle',  glyph: 'primeMatterSym',  rot: 0 },
  // Слияние
  animatedFlesh: { shape: 'circle',  glyph: 'animatedFleshSym', rot: 0 },
  greatBinding:  { shape: 'star',    glyph: 'greatBindingSym',  rot: 0 },
  // Ветка Времени
  instant:       { shape: 'circle',  glyph: 'instantSym',          rot: 0 },
  eternity:      { shape: 'circle',  glyph: 'eternitySym',         rot: 0 },
  timeline:      { shape: 'diamond', glyph: 'timelineSym',         rot: 0 },
  reincarnation: { shape: 'star',    glyph: 'reincarnationSym',    rot: 0 },
  chronoWeaver:  { shape: 'hexagon', glyph: 'chronoWeaverSym',     rot: 0 },
  temporalSigil: { shape: 'star',    glyph: 'temporalSigilSym',    rot: 0 },
  masterOfTime:  { shape: 'star',    glyph: 'masterOfTimeSym',   rot: 0, glow: 0.25 },
  // Ветка Пространства
  horizon:       { shape: 'diamond', glyph: 'horizonSym',        rot: 0 },
  dimension:     { shape: 'hexagon', glyph: 'voidsym',           rot: 0 },
  voidExpanse:   { shape: 'circle',  glyph: 'voidExpanseSym',    rot: 0 },
  parallelWorld: { shape: 'circle',  glyph: 'parallelWorldSym',  rot: 0 },
  infiniteRealms:{ shape: 'diamond',  glyph: 'infiniteRealmsSym', rot: 0 },
  spatialAnchor: { shape: 'hexagon', glyph: 'anchorSym',         rot: 0 },
  masterOfSpace: { shape: 'star',    glyph: 'masterOfSpaceSym',  rot: 0, glow: 0.25 },
  // Финальное слияние
  spacetimeContinuum:{ shape: 'hexagon', glyph: 'continuumSym',     rot: 0, glow: 0.3 },
  // Ветка Хаоса
  spark:       { shape: 'triangle',glyph: 'lightningsym',       rot: 0 },
  discord:     { shape: 'triangle',glyph: 'discordSym',         rot: 0 },
  chaosStorm:  { shape: 'hexagon', glyph: 'chaosStormSym',      rot: 0 },
  chaosBeast:  { shape: 'star',    glyph: 'chaosBeastSym',         rot: 0 },
  voidSpawn:   { shape: 'star',    glyph: 'voidSpawnSym',          rot: 0 },
  chaosLord:   { shape: 'star',    glyph: 'chaosLordSym',       rot: 0, glow: 0.25 },
  // Ветка Энтропии
  erosion:     { shape: 'diamond', glyph: 'erosionSym',         rot: 0 },
  entropyField:{ shape: 'circle',  glyph: 'entropyFieldSym',    rot: 0 },
  extinction:  { shape: 'star',    glyph: 'extinctionSym',      rot: 0 },
  voidCollapse:{ shape: 'circle',  glyph: 'voidCollapseSym',    rot: 0 },
  entropyLord: { shape: 'star',    glyph: 'entropyLordSym',     rot: 0, glow: 0.25 },
  // Финальное слияние
  oblivion:    { shape: 'circle',  glyph: 'oblivionSym',       rot: 0, glow: 0.3 },
  // Мосты
  willOWisp:  { shape: 'circle', glyph: 'tricksterSym', rot: 0 },
  lighthouse: { shape: 'square', glyph: 'lightsym',     rot: 0 },
  veil:       { shape: 'diamond',glyph: 'veilSym',      rot: 0 },
  shroud:     { shape: 'diamond',glyph: 'phantomsym',   rot: 0 },
  sprout:     { shape: 'square', glyph: 'sproutSym',    rot: 0 },
  sapling:    { shape: 'square', glyph: 'trunk',        rot: 0 },
  deathKnight:{ shape: 'star',   glyph: 'deathKnightSym', rot: 0 },
  elementalConfluence:{ shape: 'circle', glyph: 'elementalConfluenceSym', rot: 0 },
  fifthElement:       { shape: 'circle', glyph: 'fifthElementSym',       rot: 0 },
  elementalWarden:    { shape: 'hexagon',glyph: 'elementalWardenSym',    rot: 0 },
  elementalRupture:   { shape: 'triangle',glyph: 'elementalRuptureSym',  rot: 0 },
  zeal:      { shape: 'diamond', glyph: 'zealSym',           rot: 0 },
  tears:     { shape: 'circle',  glyph: 'tearsSym',          rot: 0 },
  locus:     { shape: 'diamond', glyph: 'locusSym',          rot: 0 },
  futility:  { shape: 'triangle',glyph: 'futilitySym',       rot: 0 },
  hollow:    { shape: 'circle',  glyph: 'hollowSym',         rot: 0 },
  volatileMatter:{ shape: 'square', glyph: 'volatileMatterSym', rot: 0 },
  fading:    { shape: 'circle',  glyph: 'fadingSym',         rot: 0 },
  timeShard: { shape: 'diamond', glyph: 'timeShardSym',      rot: 0 },
  chronicle: { shape: 'square',  glyph: 'chronicleSym',      rot: 0 },
  purpose:   { shape: 'diamond', glyph: 'purposeSym',        rot: 0 },
  requiem:   { shape: 'circle',  glyph: 'requiemSym',        rot: 0 },
  husk:      { shape: 'hexagon', glyph: 'huskSym',           rot: 0 },
  forgottenPage:{ shape: 'square', glyph: 'forgottenPageSym', rot: 0 },
  ardentGuardian:{ shape: 'hexagon', glyph: 'ardentGuardianSym', rot: 0 },
  axis:      { shape: 'star',    glyph: 'axisSym',           rot: 0 },
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

let iconGradSeq = 0;

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
  const gradId = `g-${id.replace(/[^a-zA-Z0-9]/g, '')}-${++iconGradSeq}`;
  const gradDef = `<radialGradient id="${gradId}" cx="35%" cy="35%"><stop offset="0%" stop-color="${lighter}" stop-opacity="0.95"/><stop offset="100%" stop-color="${color}" stop-opacity="0.95"/></radialGradient>`;

  const glyphColor = isLightColor(color) ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';

  if (glyphData.useShapeFill) {
    const g = design.glow;
    const glowEl = g
      ? `<circle cx="10" cy="10" r="13" fill="${color}" opacity="${g * 0.35}"/><circle cx="10" cy="10" r="11" fill="${color}" opacity="${g}"/>`
      : `<circle cx="10" cy="10" r="11" fill="${color}" opacity="0.08"/>`;
    const fillStyle = glyphData.strokeOnly ? 'none' : (glyphData.solidFill ? color : `url(#${gradId})`);
    const strokeStyle = glyphData.solidFill ? color : glyphColor;
    const gradDefs = (glyphData.solidFill || glyphData.strokeOnly) ? '' : gradDef;
    const strokeD = glyphData.strokePath || glyphData.d;
    const roundAttr = glyphData.round ? ' stroke-linecap="round" stroke-linejoin="round"' : '';
    const transforms = [];
    if (design.gs) transforms.push(`translate(10,10) scale(${design.gs}) translate(-10,-10)`);
    if (design.rot) transforms.push(`rotate(${design.rot} 10 10)`);
    const glyphInner = `<path d="${glyphData.d}" fill="${fillStyle}"/><path d="${strokeD}" fill="none" stroke="${strokeStyle}" stroke-width="1.6"${roundAttr}/>`;
    const glyphEl = transforms.length ? `<g transform="${transforms.join(' ')}">${glyphInner}</g>` : glyphInner;
    const rimEl = design.rim ? `<circle cx="10" cy="10" r="${design.rim}" fill="none" stroke="${color}" stroke-width="0.8" opacity="0.45"/>` : '';
    return `<svg width="${s}" height="${s}" viewBox="0 0 20 20"><defs>${gradDefs}</defs>${glowEl}${rimEl}${glyphEl}</svg>`;
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
  const roundAttr = glyphData.round ? ' stroke-linecap="round" stroke-linejoin="round"' : '';
  let glyphEl = `<path d="${glyphData.d}" fill="${gFill}" stroke="${gStroke}" stroke-width="1.6"${roundAttr}/>`;
  const transforms = [];
  if (design.gs) transforms.push(`translate(10,10) scale(${design.gs}) translate(-10,-10)`);
  if (rot) transforms.push(`rotate(${rot} 10 10)`);
  if (transforms.length) glyphEl = `<g transform="${transforms.join(' ')}">${glyphEl}</g>`;

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
  if (design.gs) {
    ctx.translate(10, 10);
    ctx.scale(design.gs, design.gs);
    ctx.translate(-10, -10);
  }
  const path = new Path2D(glyphData.d);
  if (glyphData.useShapeFill) {
    if (design.rim) {
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(10, 10, design.rim, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (!glyphData.strokeOnly) {
      ctx.fillStyle = glyphData.solidFill ? el.color : (() => {
        const grad = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, 10);
        grad.addColorStop(0, lightenColor(el.color, 40));
        grad.addColorStop(1, el.color);
        return grad;
      })();
      ctx.fill(path);
    }
    ctx.strokeStyle = glyphData.solidFill ? el.color : glyphColor;
    ctx.lineWidth = 1.6;
    if (glyphData.round) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
    const strokePath = glyphData.strokePath ? new Path2D(glyphData.strokePath) : path;
    ctx.stroke(strokePath);
  } else if (glyphData.fill) {
    ctx.fillStyle = glyphColor;
    ctx.fill(path);
  } else {
    ctx.strokeStyle = glyphColor;
    ctx.lineWidth = 1.6;
    if (glyphData.round) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
    ctx.stroke(path);
  }
  ctx.restore();
}
