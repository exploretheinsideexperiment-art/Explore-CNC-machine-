import { VectorPoint, PenState } from '../types';

export interface VisualMoveSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pen: PenState;
  isRapid: boolean;
  feedrate: number;
  rawLine: string;
  lineNumber: number;
}

export interface ParsedGCodeProgram {
  segments: VisualMoveSegment[];
  totalDrawSegments: number;
  totalRapidSegments: number;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
}

export function parseGCodeForPreview(gcodeText: string): ParsedGCodeProgram {
  const lines = gcodeText.split('\n');
  const segments: VisualMoveSegment[] = [];

  let curX = 0;
  let curY = 0;
  let curPen: PenState = 'UP';
  let curFeed = 600;
  let isAbsolute = true;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let l = 0; l < lines.length; l++) {
    let raw = lines[l];
    const commentIdx = raw.indexOf(';');
    if (commentIdx >= 0) raw = raw.substring(0, commentIdx);
    raw = raw.trim().toUpperCase();

    if (!raw) continue;

    // Check Pen Commands
    if (raw.includes('M3') || raw.includes('M03') || raw.includes('M300')) {
      curPen = 'DOWN';
      continue;
    }
    if (raw.includes('M5') || raw.includes('M05') || raw.includes('M500')) {
      curPen = 'UP';
      continue;
    }
    if (raw.includes('G90')) {
      isAbsolute = true;
      continue;
    }
    if (raw.includes('G91')) {
      isAbsolute = false;
      continue;
    }
    if (raw.includes('G92')) {
      curX = 0;
      curY = 0;
      continue;
    }

    const isRapid = raw.startsWith('G0') || raw.startsWith('G00');
    const isLinear = raw.startsWith('G1') || raw.startsWith('G01');

    if (!isRapid && !isLinear && !raw.includes('X') && !raw.includes('Y')) {
      continue;
    }

    // Extract X, Y, F
    let targetX = curX;
    let targetY = curY;

    const xMatch = raw.match(/X\s*(-?\d+(\.\d+)?)/);
    const yMatch = raw.match(/Y\s*(-?\d+(\.\d+)?)/);
    const fMatch = raw.match(/F\s*(\d+(\.\d+)?)/);

    if (fMatch) curFeed = parseFloat(fMatch[1]);

    if (xMatch) {
      const val = parseFloat(xMatch[1]);
      targetX = isAbsolute ? val : curX + val;
    }
    if (yMatch) {
      const val = parseFloat(yMatch[1]);
      targetY = isAbsolute ? val : curY + val;
    }

    // Record segment
    if (targetX !== curX || targetY !== curY) {
      segments.push({
        x1: curX,
        y1: curY,
        x2: targetX,
        y2: targetY,
        pen: curPen,
        isRapid: isRapid || curPen === 'UP',
        feedrate: curFeed,
        rawLine: lines[l],
        lineNumber: l + 1,
      });

      minX = Math.min(minX, curX, targetX);
      maxX = Math.max(maxX, curX, targetX);
      minY = Math.min(minY, curY, targetY);
      maxY = Math.max(maxY, curY, targetY);

      curX = targetX;
      curY = targetY;
    }
  }

  if (minX === Infinity) {
    minX = 0;
    minY = 0;
    maxX = 0;
    maxY = 0;
  }

  const totalDraw = segments.filter((s) => s.pen === 'DOWN').length;
  const totalRapid = segments.length - totalDraw;

  return {
    segments,
    totalDrawSegments: totalDraw,
    totalRapidSegments: totalRapid,
    bounds: {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
    },
  };
}
