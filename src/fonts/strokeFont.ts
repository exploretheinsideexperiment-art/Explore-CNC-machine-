import { VectorStroke, VectorPoint } from '../types';

/**
 * Single-line stroke font definition for CNC Pen Plotters (Hershey style).
 * Coordinate system:
 * X: 0 to width (typically 8-10 units)
 * Y: 0 (top) to 14 (baseline), 18 (descenders like g, j, p, q, y)
 */

type RawStroke = [number, number][];

interface GlyphDef {
  width: number;
  strokes: RawStroke[];
}

// Single-stroke glyph table
const GLYPHS: Record<string, GlyphDef> = {
  // Uppercase
  A: {
    width: 9,
    strokes: [
      [[0, 14], [4.5, 0], [9, 14]],
      [[2, 9], [7, 9]],
    ],
  },
  B: {
    width: 8,
    strokes: [
      [[1, 0], [1, 14]],
      [[1, 0], [5.5, 0], [7.5, 2.5], [7.5, 5], [5.5, 7], [1, 7]],
      [[1, 7], [6, 7], [8, 9.5], [8, 12], [6, 14], [1, 14]],
    ],
  },
  C: {
    width: 8,
    strokes: [
      [[7.5, 3], [5, 0], [2.5, 0], [0.5, 3], [0.5, 11], [2.5, 14], [5, 14], [7.5, 11]],
    ],
  },
  D: {
    width: 9,
    strokes: [
      [[1, 0], [1, 14]],
      [[1, 0], [5, 0], [8, 3], [8, 11], [5, 14], [1, 14]],
    ],
  },
  E: {
    width: 8,
    strokes: [
      [[1, 0], [1, 14]],
      [[1, 0], [7.5, 0]],
      [[1, 7], [6, 7]],
      [[1, 14], [7.5, 14]],
    ],
  },
  F: {
    width: 7.5,
    strokes: [
      [[1, 0], [1, 14]],
      [[1, 0], [7, 0]],
      [[1, 7], [5.5, 7]],
    ],
  },
  G: {
    width: 9,
    strokes: [
      [[8, 3], [5.5, 0], [3, 0], [1, 3], [1, 11], [3, 14], [6, 14], [8, 12], [8, 7], [5, 7]],
    ],
  },
  H: {
    width: 9,
    strokes: [
      [[1, 0], [1, 14]],
      [[8, 0], [8, 14]],
      [[1, 7], [8, 7]],
    ],
  },
  I: {
    width: 5,
    strokes: [
      [[0.5, 0], [4.5, 0]],
      [[2.5, 0], [2.5, 14]],
      [[0.5, 14], [4.5, 14]],
    ],
  },
  J: {
    width: 7,
    strokes: [
      [[1, 0], [6, 0]],
      [[4.5, 0], [4.5, 11], [3, 14], [1, 14], [0, 12]],
    ],
  },
  K: {
    width: 8.5,
    strokes: [
      [[1, 0], [1, 14]],
      [[7.5, 0], [1, 7], [8, 14]],
    ],
  },
  L: {
    width: 7,
    strokes: [
      [[1, 0], [1, 14], [7, 14]],
    ],
  },
  M: {
    width: 10,
    strokes: [
      [[1, 14], [1, 0], [5, 10], [9, 0], [9, 14]],
    ],
  },
  N: {
    width: 9,
    strokes: [
      [[1, 14], [1, 0], [8, 14], [8, 0]],
    ],
  },
  O: {
    width: 9,
    strokes: [
      [[4.5, 0], [2, 0.5], [0.5, 4], [0.5, 10], [2, 13.5], [4.5, 14], [7, 13.5], [8.5, 10], [8.5, 4], [7, 0.5], [4.5, 0]],
    ],
  },
  P: {
    width: 8,
    strokes: [
      [[1, 14], [1, 0], [5.5, 0], [7.5, 2], [7.5, 6], [5.5, 8], [1, 8]],
    ],
  },
  Q: {
    width: 9,
    strokes: [
      [[4.5, 0], [2, 0.5], [0.5, 4], [0.5, 10], [2, 13.5], [4.5, 14], [7, 13.5], [8.5, 10], [8.5, 4], [7, 0.5], [4.5, 0]],
      [[5.5, 10], [9, 16]],
    ],
  },
  R: {
    width: 8.5,
    strokes: [
      [[1, 14], [1, 0], [5.5, 0], [7.5, 2], [7.5, 6], [5.5, 8], [1, 8]],
      [[4.5, 8], [8, 14]],
    ],
  },
  S: {
    width: 8,
    strokes: [
      [[7.5, 3], [5, 0], [2.5, 0], [0.5, 2], [0.5, 5], [3, 7], [5.5, 8], [7.5, 10], [7.5, 12], [5.5, 14], [2.5, 14], [0.5, 11]],
    ],
  },
  T: {
    width: 8,
    strokes: [
      [[0.5, 0], [7.5, 0]],
      [[4, 0], [4, 14]],
    ],
  },
  U: {
    width: 8.5,
    strokes: [
      [[1, 0], [1, 11], [3, 14], [5.5, 14], [7.5, 11], [7.5, 0]],
    ],
  },
  V: {
    width: 8.5,
    strokes: [
      [[0.5, 0], [4.25, 14], [8, 0]],
    ],
  },
  W: {
    width: 11,
    strokes: [
      [[0.5, 0], [2.5, 14], [5.5, 5], [8.5, 14], [10.5, 0]],
    ],
  },
  X: {
    width: 8.5,
    strokes: [
      [[1, 0], [7.5, 14]],
      [[7.5, 0], [1, 14]],
    ],
  },
  Y: {
    width: 8,
    strokes: [
      [[0.5, 0], [4, 6], [7.5, 0]],
      [[4, 6], [4, 14]],
    ],
  },
  Z: {
    width: 8,
    strokes: [
      [[1, 0], [7.5, 0], [1, 14], [7.5, 14]],
    ],
  },

  // Lowercase
  a: {
    width: 7.5,
    strokes: [
      [[6, 4], [6, 14]],
      [[6, 6], [4, 4], [2, 4], [0.5, 6], [0.5, 11], [2, 13.5], [4.5, 14], [6, 13.5]],
    ],
  },
  b: {
    width: 7.5,
    strokes: [
      [[1, 0], [1, 14]],
      [[1, 6], [3, 4], [5.5, 4], [7, 6], [7, 11], [5.5, 13.5], [3, 14], [1, 13.5]],
    ],
  },
  c: {
    width: 6.5,
    strokes: [
      [[6, 6], [4, 4], [2, 4], [0.5, 6], [0.5, 12], [2, 14], [4, 14], [6, 12]],
    ],
  },
  d: {
    width: 7.5,
    strokes: [
      [[6.5, 0], [6.5, 14]],
      [[6.5, 12], [5, 13.5], [3, 14], [1, 12], [0.5, 9], [1, 6], [3, 4], [5, 4], [6.5, 6]],
    ],
  },
  e: {
    width: 7,
    strokes: [
      [[0.5, 9], [6.5, 9], [6.5, 6], [5, 4], [2.5, 4], [0.5, 6.5], [0.5, 11.5], [2.5, 14], [5, 14], [6.5, 12.5]],
    ],
  },
  f: {
    width: 5.5,
    strokes: [
      [[5, 1], [3.5, 0], [2, 1], [2, 14]],
      [[0.5, 5], [4.5, 5]],
    ],
  },
  g: {
    width: 7.5,
    strokes: [
      [[6, 4], [6, 16], [4.5, 18], [2, 18], [0.5, 16]],
      [[6, 6], [4, 4], [2, 4], [0.5, 6], [0.5, 11], [2, 13.5], [4.5, 14], [6, 13.5]],
    ],
  },
  h: {
    width: 7,
    strokes: [
      [[1, 0], [1, 14]],
      [[1, 6], [3, 4], [5.5, 4], [6.5, 6], [6.5, 14]],
    ],
  },
  i: {
    width: 3.5,
    strokes: [
      [[1.75, 4], [1.75, 14]],
      [[1.75, 0.5], [1.75, 1.5]], // Dot
    ],
  },
  j: {
    width: 4.5,
    strokes: [
      [[2.5, 4], [2.5, 16], [1, 18], [0, 17]],
      [[2.5, 0.5], [2.5, 1.5]],
    ],
  },
  k: {
    width: 6.5,
    strokes: [
      [[1, 0], [1, 14]],
      [[5.5, 4], [1, 9], [6, 14]],
    ],
  },
  l: {
    width: 3.5,
    strokes: [
      [[1.75, 0], [1.75, 14]],
    ],
  },
  m: {
    width: 10.5,
    strokes: [
      [[1, 4], [1, 14]],
      [[1, 6], [2.5, 4], [4.5, 4], [5.5, 6], [5.5, 14]],
      [[5.5, 6], [7, 4], [9, 4], [10, 6], [10, 14]],
    ],
  },
  n: {
    width: 7,
    strokes: [
      [[1, 4], [1, 14]],
      [[1, 6], [3, 4], [5.5, 4], [6.5, 6], [6.5, 14]],
    ],
  },
  o: {
    width: 7.5,
    strokes: [
      [[3.75, 4], [1.5, 5], [0.5, 8], [0.5, 10.5], [1.5, 13.5], [3.75, 14], [6, 13.5], [7, 10.5], [7, 8], [6, 5], [3.75, 4]],
    ],
  },
  p: {
    width: 7.5,
    strokes: [
      [[1, 4], [1, 18]],
      [[1, 6], [3, 4], [5.5, 4], [7, 6], [7, 11], [5.5, 13.5], [3, 14], [1, 13.5]],
    ],
  },
  q: {
    width: 7.5,
    strokes: [
      [[6.5, 4], [6.5, 18]],
      [[6.5, 12], [5, 13.5], [3, 14], [1, 12], [0.5, 9], [1, 6], [3, 4], [5, 4], [6.5, 6]],
    ],
  },
  r: {
    width: 5.5,
    strokes: [
      [[1, 4], [1, 14]],
      [[1, 7], [2.5, 4.5], [4.5, 4.5]],
    ],
  },
  s: {
    width: 6.5,
    strokes: [
      [[6, 6], [4.5, 4], [2, 4], [0.5, 5.5], [1, 8], [4.5, 9.5], [6, 11], [5.5, 13.5], [3.5, 14], [1, 13.5], [0.5, 12]],
    ],
  },
  t: {
    width: 5,
    strokes: [
      [[2, 1], [2, 13], [3.5, 14]],
      [[0.5, 4], [4.5, 4]],
    ],
  },
  u: {
    width: 7,
    strokes: [
      [[1, 4], [1, 12], [3, 14], [5.5, 14], [6.5, 12], [6.5, 4]],
      [[6.5, 10], [6.5, 14]],
    ],
  },
  v: {
    width: 7,
    strokes: [
      [[0.5, 4], [3.5, 14], [6.5, 4]],
    ],
  },
  w: {
    width: 10,
    strokes: [
      [[0.5, 4], [2.5, 14], [5, 7], [7.5, 14], [9.5, 4]],
    ],
  },
  x: {
    width: 6.5,
    strokes: [
      [[0.5, 4], [6, 14]],
      [[6, 4], [0.5, 14]],
    ],
  },
  y: {
    width: 7,
    strokes: [
      [[0.5, 4], [3.5, 14]],
      [[6.5, 4], [3.5, 14], [2, 18], [0.5, 17]],
    ],
  },
  z: {
    width: 6.5,
    strokes: [
      [[0.5, 4], [6, 4], [0.5, 14], [6, 14]],
    ],
  },

  // Numbers
  '0': {
    width: 8,
    strokes: [
      [[4, 0], [1.5, 1], [0.5, 4], [0.5, 10], [1.5, 13], [4, 14], [6.5, 13], [7.5, 10], [7.5, 4], [6.5, 1], [4, 0]],
      [[6.5, 2], [1.5, 12]],
    ],
  },
  '1': {
    width: 6,
    strokes: [
      [[1, 3], [3.5, 0], [3.5, 14]],
      [[1, 14], [6, 14]],
    ],
  },
  '2': {
    width: 8,
    strokes: [
      [[1, 3], [3, 0], [5.5, 0], [7.5, 2], [7.5, 5], [1, 14], [7.5, 14]],
    ],
  },
  '3': {
    width: 8,
    strokes: [
      [[1, 1], [7, 1], [4, 6], [6.5, 7], [7.5, 9.5], [7.5, 11.5], [5.5, 14], [2, 14], [0.5, 12]],
    ],
  },
  '4': {
    width: 8,
    strokes: [
      [[6, 14], [6, 0], [0.5, 9], [7.5, 9]],
    ],
  },
  '5': {
    width: 8,
    strokes: [
      [[7, 0], [1, 0], [1, 6], [5, 6], [7.5, 8], [7.5, 11.5], [5.5, 14], [2, 14], [0.5, 12]],
    ],
  },
  '6': {
    width: 8,
    strokes: [
      [[6.5, 2], [4, 0], [1.5, 2], [0.5, 6], [0.5, 11], [2, 13.5], [4.5, 14], [6.5, 12.5], [7.5, 10], [7, 7.5], [5, 6], [2.5, 6], [0.5, 8.5]],
    ],
  },
  '7': {
    width: 8,
    strokes: [
      [[0.5, 0], [7.5, 0], [3, 14]],
      [[2, 7], [5, 7]],
    ],
  },
  '8': {
    width: 8,
    strokes: [
      [[4, 0], [2, 0.8], [1, 2.5], [1, 4.5], [2.5, 6.5], [5.5, 7.5], [7, 9], [7.5, 11.5], [6, 13.5], [4, 14], [2, 13.5], [0.5, 11.5], [1, 9], [2.5, 7.5], [5.5, 6.5], [7, 4.5], [7, 2.5], [6, 0.8], [4, 0]],
    ],
  },
  '9': {
    width: 8,
    strokes: [
      [[7.5, 5.5], [5.5, 8], [3, 8], [1, 6.5], [0.5, 4], [1.5, 1.5], [3.5, 0], [6, 0.5], [7.5, 3], [7.5, 9], [6, 13], [3.5, 14], [1.5, 12]],
    ],
  },

  // Punctuation & Symbols
  ' ': {
    width: 6,
    strokes: [],
  },
  '.': {
    width: 3.5,
    strokes: [
      [[1.5, 13], [2, 13], [2, 14], [1.5, 14], [1.5, 13]],
    ],
  },
  ',': {
    width: 3.5,
    strokes: [
      [[2, 13], [2, 14], [1, 16]],
    ],
  },
  '!': {
    width: 3.5,
    strokes: [
      [[1.75, 0], [1.75, 9.5]],
      [[1.75, 13], [1.75, 14]],
    ],
  },
  '?': {
    width: 7,
    strokes: [
      [[1, 3], [3, 0], [5.5, 0], [6.5, 2.5], [5.5, 5], [3.5, 7], [3.5, 9.5]],
      [[3.5, 13], [3.5, 14]],
    ],
  },
  ':': {
    width: 3.5,
    strokes: [
      [[1.75, 5], [1.75, 6]],
      [[1.75, 13], [1.75, 14]],
    ],
  },
  ';': {
    width: 3.5,
    strokes: [
      [[1.75, 5], [1.75, 6]],
      [[2, 13], [2, 14], [1, 16]],
    ],
  },
  '-': {
    width: 6,
    strokes: [
      [[0.5, 7], [5.5, 7]],
    ],
  },
  '+': {
    width: 7,
    strokes: [
      [[1, 7], [6, 7]],
      [[3.5, 3], [3.5, 11]],
    ],
  },
  '=': {
    width: 7,
    strokes: [
      [[1, 5], [6, 5]],
      [[1, 9], [6, 9]],
    ],
  },
  '/': {
    width: 6,
    strokes: [
      [[0.5, 14], [5.5, 0]],
    ],
  },
  '(': {
    width: 4.5,
    strokes: [
      [[3.5, 0], [1, 4], [1, 10], [3.5, 14]],
    ],
  },
  ')': {
    width: 4.5,
    strokes: [
      [[1, 0], [3.5, 4], [3.5, 10], [1, 14]],
    ],
  },
  '#': {
    width: 8,
    strokes: [
      [[2.5, 0], [1.5, 14]],
      [[6.5, 0], [5.5, 14]],
      [[0.5, 4.5], [7.5, 4.5]],
      [[0.5, 9.5], [7.5, 9.5]],
    ],
  },
  '_': {
    width: 7,
    strokes: [
      [[0, 16], [7, 16]],
    ],
  },
};

export interface TextVectorResult {
  strokes: VectorStroke[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  totalPoints: number;
  strokeCount: number;
}

export function textToVectorStrokes(
  text: string,
  options: {
    fontSize?: number;       // Height in mm (e.g. 10mm)
    startX?: number;         // Start X in mm
    startY?: number;         // Start Y in mm
    lineSpacing?: number;    // Multiplier (e.g. 1.4)
    letterSpacing?: number;  // Multiplier (e.g. 1.0)
    scale?: number;          // Overall scale (default 1.0)
  } = {}
): TextVectorResult {
  const {
    fontSize = 8,
    startX = 10,
    startY = 10,
    lineSpacing = 1.4,
    letterSpacing = 1.0,
    scale = 1.0,
  } = options;

  const fontUnitScale = (fontSize / 14) * scale;
  const lineAdvancement = 18 * fontUnitScale * lineSpacing;
  const strokes: VectorStroke[] = [];

  let cursorX = startX;
  let cursorY = startY;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let totalPoints = 0;

  const lines = text.split('\n');

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    cursorX = startX;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      const glyph = GLYPHS[char] || GLYPHS[char.toUpperCase()] || GLYPHS['?'];

      if (glyph) {
        for (const rawStroke of glyph.strokes) {
          const transformedPoints: VectorPoint[] = [];

          for (const [gx, gy] of rawStroke) {
            const px = Number((cursorX + gx * fontUnitScale).toFixed(2));
            const py = Number((cursorY + gy * fontUnitScale).toFixed(2));

            transformedPoints.push({ x: px, y: py });

            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;
            totalPoints++;
          }

          if (transformedPoints.length > 0) {
            strokes.push({ points: transformedPoints });
          }
        }

        // Advance cursor
        const charWidth = glyph.width * fontUnitScale * letterSpacing;
        cursorX += charWidth;
      }
    }

    cursorY += lineAdvancement;
  }

  if (minX === Infinity) {
    minX = startX;
    minY = startY;
    maxX = startX;
    maxY = startY;
  }

  return {
    strokes,
    bounds: {
      minX,
      minY,
      maxX,
      maxY,
      width: Number((maxX - minX).toFixed(2)),
      height: Number((maxY - minY).toFixed(2)),
    },
    totalPoints,
    strokeCount: strokes.length,
  };
}
