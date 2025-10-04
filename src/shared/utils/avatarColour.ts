import { getInitials } from './initials';

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

function hashToHSL(hash: number): string {
  const h = hash % 360;
  const s = 70 + (hash % 30); // Saturation between 70-100%
  const l = 50 + (hash % 20); // Lightness between 50-70%
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function hslToRgb(hsl: string): { r: number; g: number; b: number } {
  const [h, s, l] = hsl.match(/\d+/g)!.map(Number);
  const a = (s * Math.min(l, 100 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round((255 * color) / 100);
  };
  return { r: f(0), g: f(8), b: f(4) };
}

function getBrightness({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function getAvatarColour(name: string): {
  backgroundColor: string;
  textColor: string;
} {
  const initials = getInitials(name);
  const hash = djb2Hash(initials);
  const hslColor = hashToHSL(hash);
  const rgbColor = hslToRgb(hslColor);
  const brightness = getBrightness(rgbColor);

  const backgroundColor = hslColor;
  const textColor = brightness > 128 ? '#000000' : '#FFFFFF';

  return { backgroundColor, textColor };
}
